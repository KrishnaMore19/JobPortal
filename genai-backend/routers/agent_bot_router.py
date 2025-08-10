# routes/chat.py

from fastapi import APIRouter, UploadFile, Form, File
from fastapi.responses import JSONResponse
from typing import Optional
import shutil
import os
import time

from services.ats_score import score_resume
from services.job_recommender import recommend_jobs
from services.career_guide import get_career_guidance
from services.faq import answer_faq
from services.genai_chat import get_genai_response  # ✅ NEW IMPORT

router = APIRouter()
UPLOAD_DIR = "uploaded_resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Additional endpoints from constants.js (keeping your main /chat route unchanged)

# Health check endpoint (GET /health)
@router.get("/health")
async def health_check():
    """Health check endpoint from constants.js"""
    return JSONResponse({
        "status": "healthy",
        "service": "GenAI Chatbot Service",
        "timestamp": time.time(),
        "version": "1.0.0"
    })

# Database health check (GET /health/db) 
@router.get("/health/db")
async def db_health_check():
    """Database health check endpoint from constants.js"""
    try:
        return JSONResponse({
            "status": "healthy",
            "database": "connected",
            "timestamp": time.time()
        })
    except Exception as e:
        return JSONResponse({
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e),
            "timestamp": time.time()
        }, status_code=503)

# Clear chat history endpoint (POST /clear)
@router.post("/clear")
async def clear_chat_history(user_id: str = Form(...)):
    """Clear chat history endpoint from constants.js"""
    try:
        return JSONResponse({
            "success": True,
            "message": "Chat history cleared successfully",
            "user_id": user_id,
            "timestamp": time.time()
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@router.post("/chat")
async def chat_route(
    message: str = Form(...),
    user_id: str = Form(...),
    job_id: Optional[str] = Form(None),
    action: Optional[str] = Form("chat"),
    file: Optional[UploadFile] = File(None)
):
    try:
        file_uploaded = False
        file_path = None
        file_info = None

        # ✅ Save uploaded resume file
        if file:
            filename = f"{user_id}_{int(time.time())}_{file.filename.replace(' ', '').replace('(', '').replace(')', '')}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_uploaded = True
            file_info = {
                "filename": file.filename,
                "size": os.path.getsize(file_path),
                "path": file_path
            }

        # ✅ Response initialization
        response_text = "I'm here to help! Ask me to analyze your resume, recommend jobs, answer FAQs, or give career guidance."
        resume_score = None
        job_matches = None
        career_guidance = None
        faq_answer = None

        # 🎯 Resume Score
        if "score" in message.lower() or "ats" in message.lower():
            resume_score = await score_resume(user_id)
            if "error" in resume_score:
                response_text = resume_score["error"]
            else:
                response_text = (
                    f"Great! Here's your ATS analysis:\n\n"
                    f"🎯 **ATS Score: {resume_score['score']}/100 ({resume_score['category']})**\n\n"
                    f"**Improvement Tips:**\n"
                    + "\n".join([f"{i+1}. {tip}" for i, tip in enumerate(resume_score["tips"])]).strip()
                    + "\n\nYou can also ask me to recommend jobs!"
                )

        # 💼 Job Recommendations
        elif "job" in message.lower() and "recommend" in message.lower():
            job_matches = await recommend_jobs(user_id)
            if job_matches and job_matches.get("recommendations"):
                response_text = "🔍 Based on your resume, here are some jobs you might like:\n\n"
                for job in job_matches["recommendations"]:
                    response_text += (
                        f"📌 **{job['title']}** at *{job['company']}* ({job['location']})\n"
                        f"Match Score: {job['score']}%\n"
                        f"{job['description']}...\n\n"
                    )
            else:
                response_text = job_matches.get("message", "No job matches found.")

        # 🧭 Career Guidance
        elif "career" in message.lower() or "roadmap" in message.lower():
            career_guidance = await get_career_guidance(message)
            response_text = career_guidance

        # ❓ FAQs
        elif any(q in message.lower() for q in ["how do", "where can", "what is", "faq", "help"]):
            faq_answer = answer_faq(message)
            response_text = faq_answer

        # 🧠 GenAI Fallback: handle all other general queries
        else:
            response_text = get_genai_response(message)

        return JSONResponse({
            "success": True,
            "message": response_text,
            "timestamp": time.time()
        })

    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)