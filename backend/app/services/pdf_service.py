"""PDF text extraction service - memory efficient for free tier hosting"""
import PyPDF2
import os


def extract_text_from_pdf(file_path: str, max_pages: int = 50) -> str:
    """Extract text from PDF - limit pages to avoid memory issues on free tier."""
    text = ""
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            total = len(reader.pages)
            pages_to_read = min(total, max_pages)
            for i in range(pages_to_read):
                try:
                    page_text = reader.pages[i].extract_text()
                    if page_text:
                        text += page_text + "\n"
                except Exception:
                    continue  # skip problematic pages
    except Exception as e:
        raise ValueError("Failed to extract text from PDF: {}".format(str(e)))
    return text.strip()


def get_page_count(file_path: str) -> int:
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            return len(reader.pages)
    except Exception:
        return 0


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    """Split text into smaller chunks - reduced size for free tier memory."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks[:50]  # max 50 chunks to limit memory
