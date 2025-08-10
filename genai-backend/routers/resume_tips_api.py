# routers/resume_tips_api.py

from fastapi import APIRouter, Query
from modules.resume_tips import generate_resume_tips_from_mongo

router = APIRouter(prefix="/genai/resume-tips", tags=["GenAI"])

@router.get("/")
async def get_resume_tips(user_id: str = Query(..., description="User ID")):
    try:
        tips = await generate_resume_tips_from_mongo(user_id)  # ✅ Await async function
        return {"tips": tips}
    except Exception as e:
        return {"error": str(e)}
