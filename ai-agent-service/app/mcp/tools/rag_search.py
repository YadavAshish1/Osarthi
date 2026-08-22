"""
RAG Semantic Curriculum Search MCP Tool.
"""

from typing import Optional
from langchain_core.tools import tool

from app.core.logger import logger
from app.rag.retriever import curriculum_retriever


@tool
async def rag_search_curriculum(
    query: str,
    class_name: str = "",
    subject: str = "",
    top_k: int = 5,
) -> str:
    """
    Search educational course content, curriculum lessons, and notes using dense vector semantic search.
    Can optionally filter by class grade name or subject.
    """
    try:
        hits = await curriculum_retriever.search_curriculum(
            query=query,
            class_name=class_name if class_name.strip() else None,
            subject=subject if subject.strip() else None,
            top_k=top_k,
        )

        if not hits:
            return "No relevant educational content found for this search query."

        lines = ["📖 **Relevant Medhashine Curriculum Lessons:**\n"]
        for idx, hit in enumerate(hits, 1):
            meta = hit.get("metadata", {})
            title = meta.get("title", "Untitled")
            content_id = meta.get("content_id", "")
            author = meta.get("author", "Medhashine Educator")
            source = f"{meta.get('class_name', '')} > {meta.get('subject', '')} > {meta.get('topic', '')}"
            relevance = hit.get("relevance_score", 0)
            content_snippet = hit.get("content", "")[:400].strip()
            lesson_url = f"/blog/{content_id}" if content_id else ""

            lines.append(f"**[{idx}] {title}** (Relevance: {relevance}%)")
            lines.append(f"  • Author: {author}")
            lines.append(f"  • Curriculum Path: {source}")
            if lesson_url:
                lines.append(f"  • 🔗 **Direct Blog/Lesson Link:** [{title}]({lesson_url})")
            lines.append(f"  • Excerpt:\n{content_snippet}\n")

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"RAG search MCP tool error: {err}")
        return f"❌ Error performing curriculum vector search: {str(err)}"
