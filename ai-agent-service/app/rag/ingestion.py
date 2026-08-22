"""
RAG Ingestion Pipeline — Ingests MongoDB content lessons, chunks, embeds, and indexes into Vector Store.
"""

import hashlib
from typing import Dict, Any
from bson import ObjectId

from app.core.database import get_mongo_db
from app.core.logger import logger
from app.core.exceptions import RAGIngestionError
from app.rag.chunking import extract_text_from_lesson_blocks, recursive_chunk_text
from app.rag.embeddings import embedding_service
from app.rag.vectorstore import vector_store


class ContentIngestionPipeline:
    """Orchestrates indexing of educational lessons into the vector database."""

    async def ingest_single_lesson(self, content_id: str) -> Dict[str, Any]:
        """
        Ingests a specific content lesson by ID.
        """
        try:
            db = get_mongo_db()
            lesson = await db["contents"].find_one({"_id": ObjectId(content_id)})
            if not lesson:
                return {"status": "not_found", "content_id": content_id}

            if not lesson.get("published", False) or lesson.get("deletedAt") is not None:
                return {"status": "skipped", "reason": "Lesson not published or deleted"}

            blocks = lesson.get("blocks", [])
            extracted_text = extract_text_from_lesson_blocks(blocks)
            title = lesson.get("title", "Untitled Lesson")

            if not extracted_text.strip():
                return {"status": "skipped", "reason": "No textual content available"}

            # Fetch taxonomy & author relationships
            topic_doc = await db["topics"].find_one({"_id": lesson.get("topicRef")}) if lesson.get("topicRef") else None
            subject_doc = await db["subjects"].find_one({"_id": lesson.get("subjectRef")}) if lesson.get("subjectRef") else None
            class_doc = await db["classes"].find_one({"_id": lesson.get("classRef")}) if lesson.get("classRef") else None
            
            author_doc = None
            if lesson.get("createdBy"):
                author_doc = await db["users"].find_one({"_id": lesson.get("createdBy")})

            author_name = author_doc.get("name", "Medhashine Educator") if author_doc else "Medhashine Educator"
            topic_name = topic_doc.get("name", "") if topic_doc else ""
            subject_name = subject_doc.get("name", "") if subject_doc else ""
            class_name = class_doc.get("name", "") if class_doc else ""

            header_context = f"Lesson/Blog Title: {title}\nAuthor/Educator: {author_name}\nSubject: {subject_name}\nClass: {class_name}\nTopic: {topic_name}"
            full_document_text = f"{header_context}\n\nContent:\n{extracted_text}"
            chunks = recursive_chunk_text(full_document_text, chunk_size=600, overlap=100)
            if not chunks:
                return {"status": "skipped", "reason": "Zero chunks produced"}

            meta_base = {
                "content_id": str(content_id),
                "title": title,
                "author": author_name,
                "topic": topic_name,
                "subject": subject_name,
                "class_name": class_name,
                "type": "lesson_content",
            }

            # Generate vectors
            embeddings = await embedding_service.generate_embeddings(chunks)

            # Store in Vector DB
            collection = vector_store.get_curriculum_collection()

            # Evict existing stale chunks for this content_id
            existing = collection.get(where={"content_id": str(content_id)})
            if existing and existing.get("ids"):
                collection.delete(ids=existing["ids"])

            ids = [hashlib.md5(f"{content_id}_{idx}".encode()).hexdigest() for idx in range(len(chunks))]
            metadatas = [{**meta_base, "chunk_index": idx} for idx in range(len(chunks))]

            collection.add(
                ids=ids,
                documents=chunks,
                metadatas=metadatas,
                embeddings=embeddings,
            )

            logger.info(f"Successfully indexed lesson '{title}' ({content_id}) with {len(chunks)} chunks")
            return {
                "status": "success",
                "content_id": str(content_id),
                "title": title,
                "chunks_indexed": len(chunks),
            }

        except Exception as err:
            logger.error(f"Failed to ingest content {content_id}: {err}")
            raise RAGIngestionError(f"Ingestion error for {content_id}: {str(err)}")

    async def ingest_all_lessons(self) -> Dict[str, Any]:
        """
        Bulk indexes all active and published lessons.
        """
        db = get_mongo_db()
        cursor = db["contents"].find({
            "published": True,
            "$or": [{"deletedAt": None}, {"deletedAt": {"$exists": False}}],
        }, {"_id": 1})
        indexed_count = 0
        error_count = 0

        import asyncio
        async for doc in cursor:
            try:
                res = await self.ingest_single_lesson(str(doc["_id"]))
                if res.get("status") == "success":
                    indexed_count += res.get("chunks_indexed", 0)
                await asyncio.sleep(0.6)
            except Exception as err:
                error_count += 1
                logger.error(f"Bulk ingestion error for {doc['_id']}: {err}")
                await asyncio.sleep(2.0)

        return {
            "total_chunks_indexed": indexed_count,
            "errors_encountered": error_count,
        }


content_ingestion = ContentIngestionPipeline()
