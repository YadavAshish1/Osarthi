"""
Pydantic schemas for Model metadata and RAG ingestion.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ProviderInfoSchema(BaseModel):
    id: str
    name: str
    is_configured: bool
    is_default: bool
    supported_models: List[str]


class ModelListResponseSchema(BaseModel):
    providers: List[ProviderInfoSchema]
    default_provider: str


class IngestContentRequestSchema(BaseModel):
    content_id: str = Field(..., description="MongoDB ObjectId of published Content document")


class IngestResponseSchema(BaseModel):
    status: str
    content_id: Optional[str] = None
    title: Optional[str] = None
    chunks_indexed: Optional[int] = None
    reason: Optional[str] = None
