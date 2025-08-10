# db/mongo.py
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)

db = client.genai_db

async def save_chat_to_db(
    user_id: str, 
    message: str, 
    response: str, 
    file_path: str = None, 
    is_duplicate: bool = False,
    processing_time: float = None,
    response_type: str = "normal",
    context: str = None
):
    # Your existing save logic + new fields
    chat_data = {
        "user_id": user_id,
        "message": message,
        "response": response,
        "file_path": file_path,
        "is_duplicate": is_duplicate,
        "processing_time": processing_time,
        "response_type": response_type,
        "context": context,
        "timestamp": datetime.now()
    }
    # Save to database
    await chat_collection.insert_one(chat_data)

# db/mongo.py

chat_collection = db.chat_history
interview_collection = db.interview_questions

resume_collection = db.resumes
jd_collection = db.job_descriptions
user_collection = db.users
chat_collection = db.chat_history
