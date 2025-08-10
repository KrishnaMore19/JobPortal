# services/job_search.py
from services.data_service import get_all_jobs, get_job_by_id

async def search_jobs():
    return await get_all_jobs()

async def get_job_detail(job_id: str):
    return await get_job_by_id(job_id)
