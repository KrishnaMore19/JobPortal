import io
from PyPDF2 import PdfReader

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text from a PDF given as bytes (from MongoDB).
    
    Args:
        pdf_bytes (bytes): Binary content of the PDF.
    
    Returns:
        str: Extracted text from all pages.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"❌ Failed to extract text from PDF bytes: {e}")
