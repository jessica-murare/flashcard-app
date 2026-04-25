import fitz  # PyMuPDF
import re

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    
    full_text = []
    
    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        if text.strip():
            full_text.append(f"[Page {page_num + 1}]\n{text.strip()}")
    
    doc.close()
    
    combined = "\n\n".join(full_text)
    cleaned = clean_text(combined)
    
    return cleaned


def clean_text(text: str) -> str:
    # remove multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # remove weird unicode chars
    text = text.encode('utf-8', errors='ignore').decode('utf-8')
    # strip leading/trailing whitespace
    text = text.strip()
    return text


def chunk_text(text: str, max_chars: int = 6000) -> list[str]:
    """
    Split large PDFs into chunks so Groq doesn't hit token limits.
    Splits on paragraph boundaries, not mid-sentence.
    """
    if len(text) <= max_chars:
        return [text]
    
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_len = 0

    for para in paragraphs:
        if current_len + len(para) > max_chars and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [para]
            current_len = len(para)
        else:
            current_chunk.append(para)
            current_len += len(para)

    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))

    return chunks