import os
import json
import logging
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from services.data_service import get_resume_binary_by_user_id, get_job_by_id
from utils.pdf_parser import extract_text_from_pdf
from services.embedding_service import get_or_create_chroma  # ✅ import

logger = logging.getLogger(__name__)

API_KEY = os.getenv("GEMINI_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    google_api_key=API_KEY
)

async def match_resume_with_jd(user_id: str, job_id: str) -> dict:
    try:
        # 1. Fetch Resume Binary
        resume_binary = await get_resume_binary_by_user_id(user_id)
        if not resume_binary:
            raise ValueError("Resume not found")
        logger.info("✅ Resume binary fetched.")

        # 2. Extract Resume Text
        resume_text = extract_text_from_pdf(resume_binary)
        logger.info("🧾 Resume text extracted.")

        # 3. Fetch Job Description
        job_data = await get_job_by_id(job_id)
        if not job_data or "description" not in job_data:
            raise ValueError("Job description not found")
        job_description = job_data["description"]
        logger.info("📄 Job description fetched.")

        # ✅ 4. Embed and Cache in Chroma
        docs = [Document(page_content=resume_text), Document(page_content=job_description)]
        get_or_create_chroma(docs, collection_name=f"match_{user_id}_{job_id}")
        logger.info("📦 ChromaDB embedding and caching complete.")

        # 5. Prompt
        prompt = f"""You are a resume screening assistant. Compare the following resume and job description, then return a JSON with match score (0-100), strengths, and gaps.

Resume:
{resume_text}

Job Description:
{job_description}

Respond only in JSON format like this:
{{
  "score": 85,
  "strengths": ["React.js", "MongoDB", "Docker"],
  "gaps": ["Azure DevOps", "CI/CD pipelines", "Unit Testing"]
}}"""

        message = HumanMessage(content=prompt)
        response = llm.invoke([message])
        response_text = response.content.strip()
        logger.info("🔍 Gemini Flash responded.")

        # 6. Try parsing JSON
        try:
            if response_text.startswith("```json"):
                response_text = response_text.replace("```json", "").replace("```", "").strip()
            elif response_text.startswith("```"):
                response_text = response_text.replace("```", "").strip()

            result = json.loads(response_text)
            final_result = {
                "score": result.get("score", 0),
                "strengths": result.get("strengths", []),
                "gaps": result.get("gaps", [])
            }
            logger.info(f"✅ Match Score: {final_result['score']}")
            return final_result

        except json.JSONDecodeError as e:
            logger.warning("⚠️ JSON parse failed. Trying regex...")
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(0))
                    final_result = {
                        "score": result.get("score", 0),
                        "strengths": result.get("strengths", []),
                        "gaps": result.get("gaps", [])
                    }
                    return final_result
                except json.JSONDecodeError:
                    pass

            return {
                "score": 0,
                "strengths": [],
                "gaps": [],
                "error": f"Failed to parse JSON response: {str(e)}"
            }

    except Exception as e:
        logger.error(f"❌ Error in match_resume_with_jd: {e}")
        return {
            "score": 0,
            "strengths": [],
            "gaps": [],
            "error": str(e)
        }
