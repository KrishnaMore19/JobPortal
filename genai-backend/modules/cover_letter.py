import uuid
import os
import google.generativeai as genai
from services.data_service import get_resume_binary_by_user_id, get_job_by_id
from services.embedding_service import get_embedding
from services.chroma_service import store_embeddings
from utils.pdf_parser import extract_text_from_pdf

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_cover_letter_from_mongo(user_id: str, job_id: str) -> str:
    # Fetch resume PDF bytes from MongoDB
    resume_pdf_bytes = await get_resume_binary_by_user_id(user_id)
    if not resume_pdf_bytes:
        raise ValueError("❌ Resume not found for the given user ID.")

    # Fetch job details
    job_data = await get_job_by_id(job_id)
    if not job_data:
        raise ValueError("❌ Job not found.")

    # Extract text from PDF bytes
    resume_text = extract_text_from_pdf(resume_pdf_bytes)
    job_text = job_data.get("description", "")

    # (Optional) Store embeddings if needed
    resume_embedding = get_embedding(resume_text)
    combined_text = resume_text + "\n" + job_text
    doc_id = str(uuid.uuid4())
    store_embeddings(
        collection_name="resume_jd_match",
        ids=[doc_id],
        documents=[combined_text],
        embeddings=[resume_embedding],
    )

    # Build prompt for cover letter generation
    prompt = f"""
    Write a professional cover letter for the following job description:
    {job_text}

    Based on this resume:
    {resume_text}

    Cover letter:
    """

    # Call Google Gemini API with direct REST API approach
    try:
        # Option 1: Try with gemini-1.5-flash (more widely available)
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=500,
                )
            )
            cover_letter_text = response.text.strip()
        except:
            # Option 2: Fallback to direct REST API call
            import requests
            api_key = os.getenv("GEMINI_API_KEY")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
            
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 500
                }
            }
            
            response = requests.post(url, json=data, headers=headers)
            if response.status_code != 200:
                raise RuntimeError(f"API call failed: {response.text}")
            
            result = response.json()
            cover_letter_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            
    except Exception as e:
        raise RuntimeError(f"❌ Failed to generate cover letter: {e}")

    return cover_letter_text