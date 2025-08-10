import os
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# 📥 Load environment variables
load_dotenv()

# 🔗 MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client["jobportal"]

# 🗂️ Collections
users_collection = db["users"]
jobs_collection = db["jobs"]

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
        jobs = await cursor.to_list(length=100)  # You can increase or paginate
        # Convert ObjectId to string for frontend use
        for job in jobs:
            job["_id"] = str(job["_id"])
        print(f"✅ Fetched {len(jobs)} jobs.")
        return jobs
    except Exception as e:
        print(f"❌ Exception in get_all_jobs: {e}")
        return []
