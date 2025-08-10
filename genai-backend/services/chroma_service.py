import os
import chromadb
from dotenv import load_dotenv
from typing import List

load_dotenv()

# ✅ New persistent client path
PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_store")

# ✅ Use PersistentClient instead of Client + Settings
chroma_client = chromadb.PersistentClient(path=PERSIST_DIR)


def get_or_create_collection(collection_name: str):
    """
    Get an existing collection or create a new one if it doesn't exist.
    """
    try:
        collection = chroma_client.get_or_create_collection(name=collection_name)
        return collection
    except Exception as e:
        raise RuntimeError(f"Error creating/getting ChromaDB collection: {str(e)}")


def store_embeddings(
    collection_name: str,
    ids: List[str],
    documents: List[str],
    embeddings: List[List[float]]
):
    """
    Store documents and embeddings in ChromaDB collection.
    """
    if not (len(ids) == len(documents) == len(embeddings)):
        raise ValueError("Length mismatch between ids, documents, and embeddings.")
    
    collection = get_or_create_collection(collection_name)
    
    try:
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings
        )
    except Exception as e:
        raise RuntimeError(f"Error storing embeddings to ChromaDB: {str(e)}")


def query_similar_documents(collection_name: str, query_embedding: List[float], top_k: int = 5):
    """
    Query ChromaDB for most similar documents based on embedding.
    """
    collection = get_or_create_collection(collection_name)
    try:
        return collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
    except Exception as e:
        raise RuntimeError(f"Error querying ChromaDB: {str(e)}")


def similarity_search(collection_name: str, query_embedding: List[float], top_k: int = 5):
    """
    Wrapper to match expected tool name — performs similarity search using ChromaDB.
    """
    return query_similar_documents(collection_name, query_embedding, top_k)
