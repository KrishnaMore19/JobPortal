# services/data_service.py

import os
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, Dict, List
import aiofiles
from pathlib import Path

# 📥 Load environment variables
load_dotenv()

# 🔗 MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client["jobportal"]

# 🗂️ Collections
users_collection = db["users"]
jobs_collection = db["jobs"]
chat_history_collection = db["chat_history"]  # ✅ NEW: For storing chat conversations
resumes_collection = db["resumes"]  # ✅ NEW: For storing resume metadata

# 🏥 MongoDB Health Check (NEW FUNCTION FOR RAG ROUTES)
async def get_mongodb_health() -> Dict:
    """Check MongoDB connection health"""
    try:
        # Test connection
        await client.admin.command('ping')
        
        # Get database stats
        db_stats = await db.command("dbstats")
        
        return {
            "status": "connected",
            "database": "jobportal",
            "collections": await db.list_collection_names(),
            "storage_size_mb": round(db_stats.get("storageSize", 0) / (1024 * 1024), 2),
            "data_size_mb": round(db_stats.get("dataSize", 0) / (1024 * 1024), 2),
            "total_documents": {
                "users": await users_collection.count_documents({}),
                "jobs": await jobs_collection.count_documents({}),
                "chat_history": await chat_history_collection.count_documents({})
            }
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "database": "jobportal"
        }

# 📄 Store Resume for User (NEW FUNCTION FOR RAG ROUTES)
async def store_resume_for_user(user_id: str, file_path: str) -> Dict:
    """Store resume file and metadata in MongoDB"""
    try:
        # Read the file
        async with aiofiles.open(file_path, 'rb') as f:
            resume_binary = await f.read()
        
        # Get file info
        file_info = Path(file_path)
        file_size = file_info.stat().st_size
        
        # Prepare resume document
        resume_doc = {
            "user_id": user_id,
            "filename": file_info.name,
            "original_filename": file_info.stem,
            "file_size": file_size,
            "file_type": "application/pdf",
            "resume_binary": resume_binary,
            "uploaded_at": datetime.now(),
            "file_path": file_path,
            "is_active": True
        }
        
        # Store in resumes collection
        resume_result = await resumes_collection.insert_one(resume_doc)
        
        # Update user profile with resume reference
        try:
            user_query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        except InvalidId:
            user_query = {"_id": user_id}
        
        user_update = {
            "$set": {
                "profile.resume": resume_binary,
                "profile.resume_id": resume_result.inserted_id,
                "profile.resume_uploaded_at": datetime.now(),
                "profile.resume_filename": file_info.name
            }
        }
        
        await users_collection.update_one(user_query, user_update, upsert=True)
        
        print(f"✅ Resume stored successfully for user {user_id}")
        return {
            "success": True,
            "resume_id": str(resume_result.inserted_id),
            "file_size": file_size,
            "filename": file_info.name
        }
        
    except Exception as e:
        print(f"❌ Error storing resume for user {user_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# 💬 Store Chat History (NEW FUNCTION)
async def store_chat_message(user_id: str, user_message: str, bot_response: str, 
                           message_type: str = "general", additional_data: Dict = None) -> bool:
    """Store chat conversation in MongoDB"""
    try:
        chat_doc = {
            "user_id": user_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "message_type": message_type,  # general, resume_score, job_recommendation, career_guidance, faq
            "timestamp": datetime.now(),
            "additional_data": additional_data or {},
            "session_id": f"{user_id}_{datetime.now().strftime('%Y%m%d')}"  # Daily session
        }
        
        await chat_history_collection.insert_one(chat_doc)
        return True
    except Exception as e:
        print(f"❌ Error storing chat message: {e}")
        return False

# 💬 Get Chat History (NEW FUNCTION)
async def get_chat_history(user_id: str, limit: int = 10) -> List[Dict]:
    """Get recent chat history for user"""
    try:
        cursor = chat_history_collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(limit)
        
        history = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string and format
        for chat in history:
            chat["_id"] = str(chat["_id"])
            chat["timestamp"] = chat["timestamp"].isoformat() if chat.get("timestamp") else None
        
        return list(reversed(history))  # Return in chronological order
    except Exception as e:
        print(f"❌ Error getting chat history: {e}")
        return []

# 🗑️ Clear Chat History (NEW FUNCTION)
async def clear_chat_history(user_id: str) -> Dict:
    """Clear chat history for user"""
    try:
        result = await chat_history_collection.delete_many({"user_id": user_id})
        return {
            "success": True,
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        print(f"❌ Error clearing chat history: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# 📄 ✅ Get Resume (binary PDF) from MongoDB
async def get_resume_binary_by_user_id(user_id: str) -> bytes:
    try:
        print(f"📌 Searching for user ID: {user_id}")

        try:
            query = {"_id": ObjectId(user_id)}
        except InvalidId:
            query = {"_id": user_id}

        user = await users_collection.find_one(query)

        if user:
            print(f"✅ Found user: {user.get('fullname', 'N/A')}")
            resume_binary = user.get("profile", {}).get("resume")

            if resume_binary:
                print("✅ Resume binary found.")
                return resume_binary
            else:
                print("❌ Resume field is missing or empty.")
        else:
            print("❌ No user found for that ID.")

        return None

    except Exception as e:
        print(f"❌ Exception in get_resume_binary_by_user_id: {e}")
        return None

# 📄 Get Resume Metadata (NEW FUNCTION)
async def get_resume_metadata(user_id: str) -> Optional[Dict]:
    """Get resume metadata without binary data"""
    try:
        resume = await resumes_collection.find_one(
            {"user_id": user_id, "is_active": True},
            {"resume_binary": 0}  # Exclude binary data
        )
        
        if resume:
            resume["_id"] = str(resume["_id"])
            resume["uploaded_at"] = resume["uploaded_at"].isoformat() if resume.get("uploaded_at") else None
        
        return resume
    except Exception as e:
        print(f"❌ Error getting resume metadata: {e}")
        return None

# 💼 Get Job Description by Job ID
async def get_job_by_id(job_id: str) -> dict:
    try:
        job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
        if job:
            job["_id"] = str(job["_id"])
        return job
    except Exception as e:
        print(f"❌ Exception in get_job_by_id: {e}")
        return None

# 📊 Get All Jobs from the Portal
async def get_all_jobs() -> list:
    try:
        cursor = jobs_collection.find({})
        jobs = await cursor.to_list(length=1000)  # ✅ Increased limit for RAG
        # Convert ObjectId to string for frontend use
        for job in jobs:
            job["_id"] = str(job["_id"])
        print(f"✅ Fetched {len(jobs)} jobs.")
        return jobs
    except Exception as e:
        print(f"❌ Exception in get_all_jobs: {e}")
        return []

# 👥 Get All Users from the Portal (UPDATED)
async def get_all_users() -> list:
    try:
        cursor = users_collection.find({})
        users = await cursor.to_list(length=1000)  # ✅ Increased limit
        # Convert ObjectId to string for frontend use
        for user in users:
            user["_id"] = str(user["_id"])
            # Remove sensitive data like passwords if they exist
            if "password" in user:
                del user["password"]
            if "hashedPassword" in user:
                del user["hashedPassword"]
        print(f"✅ Fetched {len(users)} users.")
        return users
    except Exception as e:
        print(f"❌ Exception in get_all_users: {e}")
        return []

# 👤 Get User by ID
async def get_user_by_id(user_id: str) -> dict:
    try:
        try:
            query = {"_id": ObjectId(user_id)}
        except InvalidId:
            query = {"_id": user_id}

        user = await users_collection.find_one(query)
        
        if user:
            user["_id"] = str(user["_id"])
            # Remove sensitive data like passwords
            if "password" in user:
                del user["password"]
            if "hashedPassword" in user:
                del user["hashedPassword"]
            print(f"✅ Found user: {user.get('fullname', 'N/A')}")
            return user
        else:
            print("❌ No user found for that ID.")
            return None
    except Exception as e:
        print(f"❌ Exception in get_user_by_id: {e}")
        return None

# 🔍 Search Jobs by Keywords
async def search_jobs(query: str = "", location: str = "", company: str = "") -> list:
    try:
        search_filter = {}
        
        if query:
            search_filter["$or"] = [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"requirements": {"$regex": query, "$options": "i"}},
                {"keywords": {"$in": [query]}}
            ]
        
        if location:
            search_filter["location"] = {"$regex": location, "$options": "i"}
        
        if company:
            search_filter["company"] = {"$regex": company, "$options": "i"}
        
        cursor = jobs_collection.find(search_filter)
        jobs = await cursor.to_list(length=100)
        
        # Convert ObjectId to string
        for job in jobs:
            job["_id"] = str(job["_id"])
        
        print(f"✅ Found {len(jobs)} jobs matching search criteria.")
        return jobs
    except Exception as e:
        print(f"❌ Exception in search_jobs: {e}")
        return []

# 📈 Get User Statistics (for analytics) - ENHANCED
async def get_user_stats() -> dict:
    try:
        total_users = await users_collection.count_documents({})
        users_with_resume = await users_collection.count_documents({"profile.resume": {"$exists": True, "$ne": None}})
        recent_users = await users_collection.count_documents({
            "createdAt": {"$gte": datetime.now().replace(day=1)}  # This month
        })
        
        # Get chat activity stats
        total_chats = await chat_history_collection.count_documents({})
        active_chat_users = len(await chat_history_collection.distinct("user_id"))
        
        return {
            "total_users": total_users,
            "users_with_resume": users_with_resume,
            "users_without_resume": total_users - users_with_resume,
            "recent_users": recent_users,
            "chat_statistics": {
                "total_messages": total_chats,
                "active_users": active_chat_users,
                "avg_messages_per_user": round(total_chats / max(active_chat_users, 1), 2)
            }
        }
    except Exception as e:
        print(f"❌ Exception in get_user_stats: {e}")
        return {
            "total_users": 0, 
            "users_with_resume": 0, 
            "users_without_resume": 0,
            "recent_users": 0,
            "chat_statistics": {"total_messages": 0, "active_users": 0, "avg_messages_per_user": 0}
        }

# 📈 Get Job Statistics (for analytics) - ENHANCED
async def get_job_stats() -> dict:
    try:
        total_jobs = await jobs_collection.count_documents({})
        
        # Get top companies
        pipeline = [
            {"$group": {"_id": "$company", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}  # ✅ Increased for better insights
        ]
        top_companies = await jobs_collection.aggregate(pipeline).to_list(length=10)
        
        # Get top locations
        pipeline = [
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}  # ✅ Increased for better insights
        ]
        top_locations = await jobs_collection.aggregate(pipeline).to_list(length=10)
        
        # Get top job categories/keywords
        pipeline = [
            {"$unwind": "$keywords"},
            {"$group": {"_id": "$keywords", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        top_keywords = await jobs_collection.aggregate(pipeline).to_list(length=10)
        
        return {
            "total_jobs": total_jobs,
            "top_companies": top_companies,
            "top_locations": top_locations,
            "top_keywords": top_keywords
        }
    except Exception as e:
        print(f"❌ Exception in get_job_stats: {e}")
        return {
            "total_jobs": 0, 
            "top_companies": [], 
            "top_locations": [],
            "top_keywords": []
        }

# 📊 Get RAG System Statistics (NEW FUNCTION)
async def get_rag_stats() -> dict:
    """Get statistics relevant to RAG system"""
    try:
        user_stats = await get_user_stats()
        job_stats = await get_job_stats()
        
        # Additional RAG-specific stats
        total_resumes = await resumes_collection.count_documents({"is_active": True})
        recent_chats = await chat_history_collection.count_documents({
            "timestamp": {"$gte": datetime.now().replace(hour=0, minute=0, second=0)}  # Today
        })
        
        return {
            "knowledge_base": {
                "total_jobs": job_stats["total_jobs"],
                "total_users": user_stats["total_users"],
                "total_resumes": total_resumes,
                "total_companies": len(job_stats["top_companies"]),
                "total_locations": len(job_stats["top_locations"])
            },
            "activity": {
                "total_chat_messages": user_stats["chat_statistics"]["total_messages"],
                "active_users": user_stats["chat_statistics"]["active_users"],
                "recent_chats_today": recent_chats
            },
            "content_diversity": {
                "top_job_keywords": job_stats.get("top_keywords", [])[:5],
                "top_companies": [comp["_id"] for comp in job_stats["top_companies"][:5]],
                "top_locations": [loc["_id"] for loc in job_stats["top_locations"][:5]]
            }
        }
    except Exception as e:
        print(f"❌ Exception in get_rag_stats: {e}")
        return {
            "knowledge_base": {"total_jobs": 0, "total_users": 0, "total_resumes": 0},
            "activity": {"total_chat_messages": 0, "active_users": 0, "recent_chats_today": 0},
            "content_diversity": {"top_job_keywords": [], "top_companies": [], "top_locations": []}
        }

# 🔧 Database Maintenance Functions (NEW)
async def cleanup_old_chat_history(days: int = 30) -> Dict:
    """Clean up old chat history"""
    try:
        cutoff_date = datetime.now().replace(day=datetime.now().day - days)
        result = await chat_history_collection.delete_many({
            "timestamp": {"$lt": cutoff_date}
        })
        
        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def cleanup_inactive_resumes() -> Dict:
    """Clean up inactive resume records"""
    try:
        result = await resumes_collection.delete_many({"is_active": False})
        
        return {
            "success": True,
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }