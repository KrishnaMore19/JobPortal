# services/career_guide.py

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY)

async def get_career_guidance(user_query: str) -> str:
    """
    Generate personalized career guidance using Gemini model.
    :param user_query: A string describing user's interests, skills, goals, etc.
    :return: AI-generated roadmap or guidance string.
    """
    prompt = f"""
You're a helpful and knowledgeable career counselor.

A user is asking for career guidance. Here's what they said:

"{user_query}"

Based on this, provide:
1. Career paths they can explore.
2. Relevant skills they should focus on.
3. A roadmap with learning resources and phases (Beginner → Intermediate → Advanced).
4. Certifications, courses, or platforms they can use.

Be structured, concise, and encouraging.
"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return f"⚠️ Error generating career guidance: {str(e)}"
