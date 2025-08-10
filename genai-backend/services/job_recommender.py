# services/job_recommender.py

# services/job_recommender.py

from services.data_service import get_all_jobs, get_resume_binary_by_user_id
from utils.keyword_matcher import match_keywords
from utils.pdf_parser import extract_text_from_pdf

async def recommend_jobs(user_id: str):
    resume_pdf = await get_resume_binary_by_user_id(user_id)
    if not resume_pdf:
        return {"error": "No resume found for this user."}

    resume_text = extract_text_from_pdf(resume_pdf)
    all_jobs = await get_all_jobs()

    recommendations = []

    for job in all_jobs:
        job_keywords = job.get("keywords", [])
        if not job_keywords:
            continue  # skip if job doesn't have keywords

        score = match_keywords(resume_text, job_keywords)

        if score >= 50:  # You can tweak this threshold
            recommendations.append({
                "job_id": str(job.get("_id")),
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "description": job.get("description", "")[:300],  # optional short desc
                "score": score
            })

    if not recommendations:
        return {
            "message": "No suitable job matches found based on your resume.",
            "recommendations": []
        }

    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return {
        "message": f"Top {min(5, len(recommendations))} job(s) recommended for user {user_id}",
        "recommendations": recommendations[:5]
    }

