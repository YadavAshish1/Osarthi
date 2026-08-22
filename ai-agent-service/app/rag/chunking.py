"""
Block-aware document chunking and text normalization for Osarthi lessons.
"""

from typing import List, Dict, Any


def extract_text_from_lesson_blocks(blocks: List[Dict[str, Any]]) -> str:
    """
    Extract structured text from Osarthi's block-based content schema.
    Handles headings, paragraphs, quotes, and list elements.
    """
    text_segments = []
    for block in blocks:
        btype = block.get("type", "")
        if btype in ("heading", "paragraph", "quote"):
            txt = (block.get("text") or "").strip()
            if txt:
                text_segments.append(txt)
        elif btype == "list":
            items = block.get("items") or []
            for item in items:
                if str(item).strip():
                    text_segments.append(f"• {str(item).strip()}")
    return "\n\n".join(text_segments)


def recursive_chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Recursively split text into contextual chunks respecting punctuation boundaries.
    """
    cleaned_text = text.strip()
    if not cleaned_text:
        return []

    if len(cleaned_text) <= chunk_size:
        return [cleaned_text]

    chunks: List[str] = []
    start = 0
    total_len = len(cleaned_text)

    while start < total_len:
        end = start + chunk_size

        if end < total_len:
            # Look for best boundary: newline, period, question mark, or semicolon
            split_candidates = [
                cleaned_text.rfind("\n\n", start, end),
                cleaned_text.rfind(". ", start, end),
                cleaned_text.rfind("? ", start, end),
                cleaned_text.rfind("\n", start, end),
            ]
            best_split = max(split_candidates)
            if best_split > start + (chunk_size // 2):
                end = best_split + 1

        chunk = cleaned_text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap
        if start >= total_len:
            break

    return chunks
