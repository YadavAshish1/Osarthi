"""
RAG Semantic and Hybrid Retriever for querying educational knowledge.
Combines Dense Vector Semantic Search with Direct MongoDB Keyword Resolution & Hinglish Transliteration.
"""

import re
from typing import List, Dict, Any, Optional
from bson import ObjectId

from app.core.database import get_mongo_db
from app.core.logger import logger
from app.rag.embeddings import embedding_service
from app.rag.vectorstore import vector_store
from app.rag.chunking import extract_text_from_lesson_blocks

# Common Hindi Literature & Grammar Transliteration Mapping
TRANSLITERATION_MAP = {
    "muhavara": "मुहावरा",
    "muhavare": "मुहावरा",
    "muhawara": "मुहावरा",
    "muhaware": "मुहावरा",
    "ras": "रस",
    "alankar": "अलंकार",
    "chhand": "छंद",
    "sandhi": "संधि",
    "samas": "समास",
    "sangya": "संज्ञा",
    "sarvanam": "सर्वनाम",
    "visheshan": "विशेषण",
    "kriya": "क्रिया",
    "kavya": "काव्य",
    "pady": "पद्य",
    "gady": "गद्य",
    "sakhi": "साखी",
    "nagmati": "नागमती",
    "padavali": "पदावली",
    "dhanush": "धनुष",
    "tulsi": "तुलसी",
    "tulsidas": "तुलसीदास",
    "surdas": "सूरदास",
    "kabir": "कबीर",
    "kabirdas": "कबीरदास",
    "chandra": "चंद्र",
    "chandralok": "चंद्रलोक",
    "chinti": "चींटी",
    "pushp": "पुष्प",
    "abhilasha": "अभिलाषा",
    "jawani": "जवानी",
    "shradha": "श्रद्धा",
    "manu": "मनु",
    "bharat": "भारत",
    "vakyansh": "वाक्यांश",
    "anekarthi": "अनेकार्थी",
    "paryayvachi": "पर्यायवाची",
    "vilom": "विलोम",
    "shrutisam": "श्रुतिसम",
}


class CurriculumRetriever:
    """Retrieves relevant lesson fragments using Hybrid Semantic + Direct Keyword lookup."""

    async def search_curriculum(
        self,
        query: str,
        class_name: Optional[str] = None,
        subject: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Execute hybrid search: Dense vector search + Direct MongoDB title resolution fallback.
        """
        hits: List[Dict[str, Any]] = []
        clean_q = (query or "").strip()
        if not clean_q:
            return hits

        # 1. Direct MongoDB Title & Keyword Match Check (with Hinglish transliteration)
        try:
            db = get_mongo_db()
            raw_words = [w.lower() for w in re.split(r'[\s,;:?!\'"()\[\]]+', clean_q) if len(w) > 1 and w.lower() not in ["blog", "lesson", "summary", "ka", "ki", "ke", "me", "mein", "par", "details", "kya", "hai", "karo", "do", "batao", "samjha", "sort", "short", "very", "latest", "recent", "about", "iska", "iski", "isko"]]

            search_keywords = list(raw_words)
            for w in raw_words:
                if w in TRANSLITERATION_MAP:
                    search_keywords.append(TRANSLITERATION_MAP[w])

            matched_docs = []
            for kw in search_keywords:
                cursor = db["contents"].find({
                    "title": {"$regex": re.escape(kw), "$options": "i"},
                    "published": True,
                    "deletedAt": None,
                }).limit(3)
                async for doc in cursor:
                    if doc["_id"] not in [d["_id"] for d in matched_docs]:
                        matched_docs.append(doc)

            for doc in matched_docs:
                cid = str(doc["_id"])
                title = doc.get("title", "Untitled")
                extracted_text = extract_text_from_lesson_blocks(doc.get("blocks", []))
                
                # Fetch metadata
                c_name = class_name or "Class"
                s_name = subject or "Subject"
                if doc.get("classRef"):
                    c_doc = await db["classes"].find_one({"_id": doc["classRef"]})
                    if c_doc:
                        c_name = c_doc.get("name", c_name)
                if doc.get("subjectRef"):
                    s_doc = await db["subjects"].find_one({"_id": doc["subjectRef"]})
                    if s_doc:
                        s_name = s_doc.get("name", s_name)

                author_name = "Medhashine Educator"
                if doc.get("createdBy"):
                    u_doc = await db["users"].find_one({"_id": doc["createdBy"]})
                    if u_doc:
                        author_name = u_doc.get("name", author_name)

                full_snippet = f"Lesson/Blog Title: {title}\nAuthor/Educator: {author_name}\nSubject: {s_name}\nClass: {c_name}\n\nContent:\n{extracted_text[:1200]}"

                hits.append({
                    "content": full_snippet,
                    "metadata": {
                        "content_id": cid,
                        "title": title,
                        "author": author_name,
                        "class_name": c_name,
                        "subject": s_name,
                        "topic": title,
                        "type": "direct_match",
                    },
                    "relevance_score": 98.0,
                })

        except Exception as e:
            logger.warning(f"Direct MongoDB keyword lookup error: {e}")

        # 2. Dense Vector Semantic Search via ChromaDB
        try:
            query_vector = await embedding_service.generate_embeddings([clean_q])
            collection = vector_store.get_curriculum_collection()

            where_filter = {}
            if class_name:
                where_filter["class_name"] = {"$eq": class_name}
            if subject:
                where_filter["subject"] = {"$eq": subject}

            results = collection.query(
                query_embeddings=query_vector,
                n_results=top_k,
                where=where_filter if where_filter else None,
                include=["documents", "metadatas", "distances"],
            )

            if results.get("documents") and results["documents"][0]:
                for doc, meta, distance in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                ):
                    cid = meta.get("content_id")
                    # Avoid duplicate if already matched by direct search
                    if cid and any(h.get("metadata", {}).get("content_id") == cid for h in hits):
                        continue

                    relevance_score = max(0.0, min(1.0, 1.0 - float(distance)))
                    hits.append({
                        "content": doc,
                        "metadata": meta,
                        "relevance_score": round(relevance_score * 100, 1),
                    })

        except Exception as err:
            logger.error(f"Semantic vector search execution error: {err}")

        # Sort by relevance score descending
        hits.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return hits[:top_k]


curriculum_retriever = CurriculumRetriever()
