"""
Asynchronous MongoDB connection lifecycle manager using Motor.
"""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logger import logger

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def init_mongo() -> AsyncIOMotorDatabase:
    """Initialize MongoDB async client and ping database."""
    global _client, _db
    if _db is not None:
        return _db

    _client = AsyncIOMotorClient(settings.mongodb_uri)
    uri_db = settings.mongodb_uri.split("?")[0].rstrip("/").rsplit("/", 1)[-1] if "/" in settings.mongodb_uri else None
    db_name = uri_db if uri_db and not uri_db.startswith("mongodb") and not uri_db.startswith("localhost") else settings.mongodb_db_name
    _db = _client[db_name]

    # Verification ping with timeout
    try:
        await _client.admin.command("ping")
        logger.info(f"Connected to MongoDB instance: {db_name}")
    except Exception as err:
        logger.warning(f"MongoDB ping warning ({err}). Will retry on operation execution.")
    return _db


async def close_mongo() -> None:
    """Close MongoDB connection gracefully."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("Closed MongoDB connection pool")


def get_mongo_db() -> AsyncIOMotorDatabase:
    """Get active MongoDB database reference."""
    if _db is None:
        raise RuntimeError("MongoDB is not initialized. Ensure init_mongo() is called on application startup.")
    return _db
