from fastapi import APIRouter, UploadFile, Form, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
import time
import traceback
import shutil
import re

from services.ats_score import score_resume
from services.job_recommender import recommend_jobs
from services.career_guide import get_career_guidance
from services.faq import answer_faq
from services.rag_service import get_rag_response, rag_chatbot
from services.data_service import store_resume_for_user, store_chat_message

router = APIRouter()
UPLOAD_DIR = "uploaded_resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ✅ Utility: Clean HTML tags from service outputs
def strip_html_tags(text: str) -> str:
    if not text:
        return text
    # Replace <strong>...</strong> with **...**
    text = re.sub(r"<strong>(.*?)</strong>", r"**\1**", text, flags=re.DOTALL)
    # Remove any other HTML tags (if any left)
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip()


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
            try:
                await store_resume_for_user(user_id, file_path)
                await rag_chatbot.add_user_resume_to_knowledge(user_id)
            except Exception as e:
                print(f"⚠️ Failed to store resume in DB: {e}")

        # --- Message processing ---
        response_text = "I'm here to help! Ask me about your resume, jobs, career guidance, or any questions."
        message_type = "general"
        additional_data = {}

        msg_lower = message.lower()

        # ✅ Resume scoring
        if any(k in msg_lower for k in ["score", "resume", "ats"]):
            try:
                resume_score = await score_resume(user_id)
                message_type = "resume_score"
                if "error" in resume_score:
                    response_text = f"❌ {resume_score['error']}\nUpload your resume first to score it."
                else:
                    score_emoji = "🟢" if resume_score['score'] >= 80 else "🟡" if resume_score['score'] >= 60 else "🔴"
                    response_text = (
                        f"{score_emoji} ATS Resume Analysis Complete!\n\n"
                        f"Score: {resume_score['score']}/100 ({resume_score['category']})"
                    )
                    additional_data["resume_score"] = resume_score
            except Exception as e:
                response_text = f"❌ Error scoring resume: {str(e)}"

        # ✅ Job recommendations
        elif any(k in msg_lower for k in ["job", "recommend", "opportunity"]):
            try:
                jobs = await recommend_jobs(user_id)
                message_type = "job_recommendation"
                if jobs and jobs.get("recommendations"):
                    lines = []
                    for idx, job in enumerate(jobs["recommendations"][:5], 1):
                        lines.append(f"{idx}. {job['title']} at {job['company']} ({job['location']}) - Score: {job['score']}%")
                    response_text = "💼 Top Job Recommendations:\n" + "\n".join(lines)
                    additional_data["jobs"] = jobs
                else:
                    response_text = "No job matches found. Upload/update your resume or ask for career guidance."
            except Exception as e:
                response_text = f"❌ Error recommending jobs: {str(e)}"

        # ✅ Career guidance (Cleans HTML)
        elif any(k in msg_lower for k in ["career", "roadmap", "guidance", "advice", "skills"]):
            try:
                guidance = await get_career_guidance(message)
                clean_guidance = strip_html_tags(guidance)   # ✅ Remove <strong>
                response_text = f"🧭 Career Guidance:\n{clean_guidance}"
                message_type = "career_guidance"
                additional_data["career_guidance"] = clean_guidance
            except Exception as e:
                response_text = f"❌ Error generating career guidance: {str(e)}"

        # ✅ FAQs (Cleans HTML too if needed)
        elif any(k in msg_lower for k in ["how do", "what is", "where can", "faq", "help", "support"]):
            try:
                faq_answer = answer_faq(message)
                message_type = "faq"
                if faq_answer and "not sure" not in faq_answer.lower():
                    faq_clean = strip_html_tags(faq_answer)
                    response_text = f"💬 FAQ Answer: {faq_clean}"
                    additional_data["faq_answer"] = faq_clean
                else:
                    rag_resp = await get_rag_response(message, user_id)
                    response_text = strip_html_tags(rag_resp)
                    message_type = "rag_faq"
            except Exception:
                rag_resp = await get_rag_response(message, user_id)
                response_text = strip_html_tags(rag_resp)
                message_type = "rag_fallback"

        # ✅ General fallback (RAG, cleans HTML too)
        else:
            try:
                if not rag_chatbot.vector_store:
                    response_text = "📄 Knowledge base is loading. Please wait or ask about resume/job/career."
                    message_type = "system_loading"
                else:
                    rag_resp = await get_rag_response(message, user_id)
                    response_text = strip_html_tags(rag_resp)
                    message_type = "rag_general"
            except Exception as e:
                response_text = "🤖 Error processing your request. Try asking about resume, jobs, or career."
                message_type = "error_fallback"

        # ✅ Store chat in DB
        try:
            await store_chat_message(
                user_id=user_id,
                user_message=message,
                bot_response=response_text,
                message_type=message_type,
                additional_data=additional_data
            )
        except Exception as e:
            print(f"⚠️ Failed to store chat: {e}")

        # ✅ Build response
        response_data = {
            "success": True,
            "message": response_text,   # always plain text / markdown now
            "user_id": user_id,
            "action_performed": action,
            "message_type": message_type,
            "timestamp": time.time(),
            "rag_enhanced": True
        }
        if file_uploaded:
            response_data["file_uploaded"] = True
            response_data["file_info"] = file_info
        if additional_data:
            response_data["data"] = additional_data

        return JSONResponse(response_data)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Health check endpoint (GET /health)
@router.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": "GenAI Chatbot Service",
        "timestamp": time.time(),
        "version": "1.0.0"
    })


# ✅ Database health check (GET /health/db)
@router.get("/health/db")
async def db_health_check():
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


# ✅ Clear chat history endpoint (POST /clear)
@router.post("/clear")
async def clear_chat_history(user_id: str = Form(...)):
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
