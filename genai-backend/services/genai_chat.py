# services/genai_chat.py
import os
from dotenv import load_dotenv
from langchain.schema import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ✅ Use Gemini Flash model
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",  # ⚡ Faster + cheaper than gemini-pro
    google_api_key=GEMINI_API_KEY
)

def get_genai_response(message: str) -> str:
    try:
        chat = [HumanMessage(content=message)]
        response = llm.invoke(chat)
        return response.content
    except Exception as e:
        return f"⚠️ Error from GenAI: {str(e)}"
