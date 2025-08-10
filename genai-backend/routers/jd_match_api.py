from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
import logging

from modules.resume_jd_matcher import match_resume_with_jd

# Router configuration
router = APIRouter(prefix="/genai/jd-match", tags=["GenAI"])

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/")
async def resume_jd_match_api(
    user_id: str = Query(..., description="MongoDB User ID"),
    job_id: str = Query(..., description="MongoDB Job ID")
):
    """
    Compare a user's resume with a job description and return structured match result.
    """
    try:
        result = await match_resume_with_jd(user_id, job_id)

        # Validate result structure
        if not isinstance(result, dict) or "score" not in result:
            logger.warning(f"Unexpected match result format: {result}")
            raise HTTPException(status_code=422, detail="Invalid match result format")

        return JSONResponse(content={"success": True, "data": result})
    
    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Resume-JD matching failed unexpectedly.")
        raise HTTPException(status_code=500, detail="Internal server error")
