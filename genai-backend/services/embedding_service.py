import os
import requests
from dotenv import load_dotenv
from typing import List
from langchain_community.vectorstores import Chroma
from langchain.schema.document import Document
from langchain.embeddings.base import Embeddings

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# Custom Gemini Embedding class
class GeminiEmbeddings(Embeddings):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent"

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._get_embedding(text) for text in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._get_embedding(text)

    def _get_embedding(self, text: str) -> List[float]:
        json_data = {
            "model": "models/embedding-001",
            "content": {
                "parts": [{"text": text}]
            }
        }

        response = requests.post(f"{self.endpoint}?key={self.api_key}", json=json_data)
        if response.status_code != 200:
            raise RuntimeError(f"Embedding request failed: {response.text}")
        data = response.json()
        return data["embedding"]["values"]

# ✅ Global embedding instance
embedding_function = GeminiEmbeddings(api_key=API_KEY)

# ✅ Persistent Chroma DB path
CHROMA_PERSIST_DIR = "chroma_db"

# ✅ Main function to get or create cached embedding collection
def get_or_create_chroma(docs: List[Document], collection_name: str) -> Chroma:
    try:
        chroma = Chroma(
            collection_name=collection_name,
            embedding_function=embedding_function,
            persist_directory=CHROMA_PERSIST_DIR
        )
        _ = chroma.get()["ids"]  # Force access to ensure it exists
        return chroma
    except Exception:
        chroma = Chroma.from_documents(
            documents=docs,
            embedding=embedding_function,
            collection_name=collection_name,
            persist_directory=CHROMA_PERSIST_DIR
        )
        chroma.persist()
        return chroma

# ✅ Utility for single-use embedding (used in recommender, cover letter, tips)
def get_embedding(text: str) -> List[float]:
    return embedding_function.embed_query(text)
