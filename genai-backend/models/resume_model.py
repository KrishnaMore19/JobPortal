# models/resume_model.py
from pydantic import BaseModel
from typing import List, Optional, Union

class ResumeScoreResponse(BaseModel):
    score: float
    category: str
    tips: List[str]
    resume_length: str
    matched_keywords: List[str]
    word_count: int
    total_keywords_found: int
