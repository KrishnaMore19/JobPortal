FAQ_RESPONSES = {
    "how do i apply": "To apply, go to the job listing and click on the 'Apply Now' button.",
    "where can i find internships": "Internships are listed under the 'Internships' tab in the job search section.",
    "how do i update my resume": "You can upload a new resume by clicking the 'Upload Resume' button on your profile or directly in this chat.",
    "how to contact support": "You can contact support by emailing support@jobportal.com or using the 'Help' chat option."
}

def answer_faq(question: str) -> str:
    """
    Simple FAQ answer matching based on keyword detection.
    """
    q = question.lower()
    for key in FAQ_RESPONSES:
        if key in q:
            return FAQ_RESPONSES[key]
    return "I'm not sure about that. You can contact our support team for help."
