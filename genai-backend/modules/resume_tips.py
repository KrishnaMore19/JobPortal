# modules/resume_tips.py

import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv
import uuid

from services.data_service import get_resume_binary_by_user_id  # ✅ Use binary fetch
from utils.pdf_parser import extract_text_from_pdf              # ✅ Updated function
from services.embedding_service import get_embedding
from services.chroma_service import store_embeddings

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")

async def generate_resume_tips_from_mongo(user_id: str) -> str:
    try:
        # Step 1: Fetch resume binary from MongoDB
        resume_binary = await get_resume_binary_by_user_id(user_id)
        if not resume_binary:
            return "❌ Resume not found for this user."

        logger.info("📄 Resume binary fetched successfully.")

        # Step 2: Extract text from PDF binary
        resume_text = extract_text_from_pdf(resume_binary)

        # Step 3: Embed + Store
        embedding = get_embedding(resume_text)
        doc_id = str(uuid.uuid4())
        store_embeddings(
            collection_name="resume_tips_feedback",
            ids=[doc_id],
            documents=[resume_text],
            embeddings=[embedding]
        )

        # Step 4: Prompt Gemini for feedback
        prompt = f"""
You are a professional resume reviewer.

Analyze the resume below and give 3 clear, actionable suggestions to improve it:

Resume:
{resume_text}
"""

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        logger.error(f"❌ Error in generate_resume_tips_from_mongo: {e}")
        return "⚠️ Unable to generate resume tips at this time."
