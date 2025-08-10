from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
import logging
import traceback

from services.data_service import get_resume_binary_by_user_id, get_job_by_id
from modules.cover_letter import generate_cover_letter_from_mongo

router = APIRouter(prefix="/genai/cover-letter", tags=["GenAI"])

# Logger setup
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@router.get("/")
async def generate_cover_letter_route(
    user_id: str = Query(..., description="User ID from MongoDB"),
    job_id: str = Query(..., description="Job ID from MongoDB"),
):
    """
    📝 Generate a personalized cover letter using the user's resume and job description.
    """
    try:
        logger.info(f"📩 Cover letter generation request received for user_id={user_id} and job_id={job_id}")

        # Check if resume binary exists
        resume_binary = await get_resume_binary_by_user_id(user_id)
        if not resume_binary:
            logger.warning(f"❌ Resume binary not found for user_id={user_id}")
            raise HTTPException(status_code=404, detail="❌ Resume binary not found for the given user ID.")

        # Check if job exists
        job_data = await get_job_by_id(job_id)
        if not job_data:
            logger.warning(f"❌ Job not found for job_id={job_id}")
            raise HTTPException(status_code=404, detail="❌ Job not found for the given job ID.")

        # Generate cover letter
        cover_letter = await generate_cover_letter_from_mongo(user_id, job_id)

        if not cover_letter or "error" in cover_letter.lower():
            logger.error("❌ Cover letter generation failed internally.")
            raise HTTPException(status_code=500, detail="❌ Cover letter generation failed.")

        logger.info("✅ Cover letter generated successfully.")
        return JSONResponse(content={"cover_letter": cover_letter}, status_code=200)

    except HTTPException as http_exc:
        logger.warning(f"⚠️ HTTP Exception: {http_exc.detail}")
        raise http_exc

    except Exception as e:
        logger.error("❌ Unexpected error in /genai/cover-letter route.")
        logger.error(str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unexpected server error.")
