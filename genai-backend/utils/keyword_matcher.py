# utils/keyword_matcher.py

def match_keywords(resume_text: str, keywords: list) -> int:
    """
    Compares keywords to resume text and returns a match percentage (0–100).
    
    Args:
        resume_text (str): Extracted text from resume.
        keywords (list): List of important keywords from job description.

    Returns:
        int: Match score (percentage of keywords found in resume).
    """
    if not resume_text or not keywords:
        return 0

    resume_text_lower = resume_text.lower()
    matched = 0

    for keyword in keywords:
        if keyword.lower() in resume_text_lower:
            matched += 1

    score = int((matched / len(keywords)) * 100)
    return score
