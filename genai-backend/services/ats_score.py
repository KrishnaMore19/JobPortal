from services.data_service import get_resume_binary_by_user_id
from utils.pdf_parser import extract_text_from_pdf
from utils.keyword_matcher import match_keywords
import re
from typing import Dict, List


async def score_resume(user_id: str) -> Dict:
    """
    Simple resume scoring for chatbot - returns score, improvement tips, and additional metrics.
    
    Args:
        user_id (str): The user's ID to fetch resume
    
    Returns:
        Dict: Resume score and improvement tips with all required fields
    """
    # Fetch resume
    resume_pdf = await get_resume_binary_by_user_id(user_id)
    if not resume_pdf:
        return {"error": "Resume not found. Please upload your resume first."}

    # Extract text
    try:
        resume_text = extract_text_from_pdf(resume_pdf)
        if not resume_text:
            return {"error": "Could not read your resume. Please ensure it's a valid PDF."}
    except Exception:
        return {"error": "Failed to process your resume. Please try uploading again."}

    # Calculate metrics
    word_count = len(resume_text.split())
    resume_length = get_resume_length_category(word_count)
    
    # Calculate ATS score
    ats_score = calculate_ats_compatibility(resume_text)
    
    # Get matched keywords (basic professional keywords)
    professional_keywords = [
        'experience', 'project', 'managed', 'developed', 'created', 'led',
        'achieved', 'improved', 'implemented', 'designed', 'built',
        'collaborated', 'team', 'client', 'solution', 'skills',
        'education', 'university', 'degree', 'certification',
        'software', 'technical', 'analysis', 'communication'
    ]
    
    matched_keywords_list = get_matched_keywords(resume_text, professional_keywords)
    
    # Generate improvement tips
    tips = generate_improvement_tips(resume_text, ats_score)
    
    # Get score category
    score_category = get_score_category(ats_score)
    
    return {
        "score": ats_score,
        "category": score_category,
        "tips": tips,
        "resume_length": resume_length,
        "matched_keywords": matched_keywords_list,
        "word_count": word_count,
        "total_keywords_found": len(matched_keywords_list)
    }


def get_resume_length_category(word_count: int) -> str:
    """Categorize resume length."""
    if word_count < 150:
        return "Too Short"
    elif word_count < 300:
        return "Short"
    elif word_count < 600:
        return "Optimal"
    elif word_count < 900:
        return "Long"
    else:
        return "Too Long"


def get_matched_keywords(resume_text: str, keywords: List[str]) -> List[str]:
    """Get list of keywords that were found in the resume."""
    resume_text_lower = resume_text.lower()
    matched = []
    
    for keyword in keywords:
        if keyword.lower() in resume_text_lower:
            matched.append(keyword)
    
    return matched


def calculate_ats_compatibility(resume_text: str) -> int:
    """Calculate overall ATS compatibility score (0-100)."""
    score = 0
    
    # 1. Essential Sections (40 points max)
    sections_found = 0
    essential_sections = [
        r'\b(?:experience|work experience|employment|professional experience)\b',
        r'\b(?:education|academic|degree|university|college)\b',
        r'\b(?:skills|technical skills|competencies|technologies)\b',
        r'\b(?:contact|email|phone|address)\b'
    ]
    
    for section in essential_sections:
        if re.search(section, resume_text, re.IGNORECASE):
            sections_found += 1
    
    score += sections_found * 10  # 10 points per section
    
    # 2. Professional Keywords (25 points max)
    professional_keywords = [
        'experience', 'project', 'managed', 'developed', 'created', 'led',
        'achieved', 'improved', 'implemented', 'designed', 'built',
        'collaborated', 'team', 'client', 'solution', 'skills'
    ]
    
    keyword_score = match_keywords(resume_text, professional_keywords)
    score += min(keyword_score // 4, 25)  # Convert to 25-point scale
    
    # 3. Contact Information (15 points max)
    contact_score = 0
    if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text):
        contact_score += 8  # Email found
    if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text):
        contact_score += 7  # Phone found
    
    score += contact_score
    
    # 4. Formatting Quality (10 points max)
    formatting_score = 0
    # Has bullet points or structure
    if any(marker in resume_text for marker in ['•', '-', '*', '→']):
        formatting_score += 5
    # Reasonable length
    word_count = len(resume_text.split())
    if 200 <= word_count <= 1000:
        formatting_score += 5
    
    score += formatting_score
    
    # 5. Content Quality (10 points max)
    content_score = 0
    # Has numbers/achievements
    if re.search(r'\b\d+(?:\.\d+)?(?:%|percent|\+|years?|months?)\b', resume_text, re.IGNORECASE):
        content_score += 5
    # Professional tone (no first person)
    if not any(phrase in resume_text.lower() for phrase in ['i am', 'my name is', 'i have']):
        content_score += 5
    
    score += content_score
    
    return min(score, 100)


def generate_improvement_tips(resume_text: str, ats_score: int) -> List[str]:
    """Generate specific improvement tips based on resume analysis."""
    tips = []
    
    # Check missing sections
    sections_check = [
        (r'\b(?:experience|work experience|employment)\b', "Add a 'Work Experience' section with your job history"),
        (r'\b(?:education|academic|degree|university)\b', "Include an 'Education' section with your qualifications"),
        (r'\b(?:skills|technical skills|competencies)\b', "Add a 'Skills' section listing your technical abilities"),
    ]
    
    for pattern, tip in sections_check:
        if not re.search(pattern, resume_text, re.IGNORECASE):
            tips.append(tip)
    
    # Contact information
    if not re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text):
        tips.append("Add your email address at the top of your resume")
    
    if not re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text):
        tips.append("Include your phone number in the contact section")
    
    # Content improvements
    word_count = len(resume_text.split())
    if word_count < 200:
        tips.append("Expand your resume with more detailed descriptions of your work")
    elif word_count > 1000:
        tips.append("Make your resume more concise - aim for 1-2 pages maximum")
    
    # Formatting
    if not any(marker in resume_text for marker in ['•', '-', '*']):
        tips.append("Use bullet points to make your achievements easier to read")
    
    # Keywords and achievements
    if not re.search(r'\b(?:achieved|managed|developed|created|led|improved)\b', resume_text, re.IGNORECASE):
        tips.append("Start bullet points with strong action verbs like 'achieved', 'managed', 'developed'")
    
    if not re.search(r'\b\d+(?:\.\d+)?(?:%|percent|\+|years?|months?)\b', resume_text, re.IGNORECASE):
        tips.append("Include specific numbers and percentages to quantify your achievements")
    
    # ATS-specific tips
    if ats_score < 70:
        tips.append("Use standard section headings like 'Work Experience', 'Education', 'Skills'")
        tips.append("Avoid using images, tables, or fancy formatting that ATS systems can't read")
    
    # Professional tone
    if any(phrase in resume_text.lower() for phrase in ['i am', 'my name is', 'i have']):
        tips.append("Write in third person - avoid using 'I', 'my', or 'me'")
    
    # General ATS tips
    if ats_score < 80:
        tips.append("Save your resume as a PDF to preserve formatting")
        tips.append("Use keywords from job descriptions you're applying to")
    
    # Limit to most important tips
    return tips[:6] if tips else ["Your resume looks good! Keep it updated with your latest achievements."]


def get_score_category(score: int) -> str:
    """Convert numerical score to category."""
    if score >= 90:
        return "Excellent"
    elif score >= 80:
        return "Very Good"
    elif score >= 70:
        return "Good" 
    elif score >= 60:
        return "Fair"
    else:
        return "Needs Improvement"