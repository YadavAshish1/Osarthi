"""
Vector Store repository manager using ChromaDB.
"""

from typing import Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.core.logger import logger

_chroma_client: Optional[chromadb.ClientAPI] = None


class VectorStoreManager:
    """Manages persistent ChromaDB collections for knowledge retrieval."""

    def __init__(self):
        self.persist_directory = settings.chroma_persist_dir
        self.collection_name = settings.chroma_collection_name

    def get_client(self) -> chromadb.ClientAPI:
        global _chroma_client
        if _chroma_client is None:
            _chroma_client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            logger.info(f"Initialized ChromaDB persistent vector database at {self.persist_directory}")
        return _chroma_client

    def get_curriculum_collection(self) -> chromadb.Collection:
        client = self.get_client()
        return client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def reset_curriculum_collection(self) -> chromadb.Collection:
        client = self.get_client()
        try:
            client.delete_collection(self.collection_name)
        except Exception:
            pass
        return client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )


vector_store = VectorStoreManager()
