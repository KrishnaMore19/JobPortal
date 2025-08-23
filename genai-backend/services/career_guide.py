# services/career_guide.py - Debug version

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print(f"🔑 GEMINI_API_KEY exists: {'Yes' if GEMINI_API_KEY else 'No'}")

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY)

async def get_career_guidance(user_query: str) -> str:
    """
    Generate personalized career guidance using Gemini model.
    :param user_query: A string describing user's interests, skills, goals, etc.
    :return: AI-generated roadmap or guidance string.
    """
    print(f"📝 Career guidance request: {user_query}")
    
    prompt = f"""
You're a helpful and knowledgeable career counselor.

A user is asking for career guidance. Here's what they said:

"{user_query}"

Based on this, provide:
1. Career paths they can explore.
2. Relevant skills they should focus on.
3. A roadmap with learning resources and phases (Beginner → Intermediate → Advanced).
4. Certifications, courses, or platforms they can use.

Be structured, concise, and encouraging. Keep response under 400 words.
"""
    try:
        print("🤖 Calling Gemini API...")
        response = llm.invoke([HumanMessage(content=prompt)])
        print(f"✅ Gemini response received: {len(response.content)} characters")
        print(f"📄 First 100 chars: {response.content[:100]}...")
        return response.content
    except Exception as e:
        print(f"❌ Gemini API Error: {str(e)}")
        return f"⚠️ Error generating career guidance: {str(e)}"