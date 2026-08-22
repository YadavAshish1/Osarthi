"""
RAG Ingestion and Vector Indexing Endpoints.
"""

from fastapi import APIRouter, Depends
from app.core.security import AuthenticatedUser
from app.api.dependencies import get_current_admin, get_current_super_admin
from app.api.schemas.rag import IngestContentRequestSchema, IngestResponseSchema
from app.rag.ingestion import content_ingestion

router = APIRouter(prefix="/rag", tags=["RAG Ingestion"])


@router.post("/ingest", response_model=IngestResponseSchema, summary="Ingest single published lesson into vector database")
async def ingest_single_lesson(body: IngestContentRequestSchema):
    """
    Called by Node.js backend webhook upon content publication or manual admin trigger.
    """
    result = await content_ingestion.ingest_single_lesson(content_id=body.content_id)
    return result


@router.post("/ingest-all", summary="Bulk re-index all published content (Super Admin only)")
async def ingest_all_lessons(admin: AuthenticatedUser = Depends(get_current_super_admin)):
    """
    Bulk iterates over all published curriculum items and re-indexes them.
    """
    result = await content_ingestion.ingest_all_lessons()
    return result
