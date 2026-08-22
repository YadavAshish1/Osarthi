"""
Persistent Multi-turn Conversation Memory Store (MongoDB).
Handles sliding window history, serialization, and session management.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage

from app.core.database import get_mongo_db
from app.core.logger import logger

COLLECTION_NAME = "chat_conversations"
DEFAULT_WINDOW_LIMIT = 40


def serialize_langchain_message(msg: BaseMessage) -> Dict[str, Any]:
    """Serialize LangChain message into MongoDB document format."""
    return {
        "role": msg.type,
        "content": msg.content,
        "timestamp": datetime.now(timezone.utc),
        "additional_kwargs": getattr(msg, "additional_kwargs", {}) or {},
    }


def deserialize_langchain_message(doc: Dict[str, Any]) -> BaseMessage:
    """Deserialize MongoDB document back into LangChain message."""
    role = doc.get("role", "human")
    content = doc.get("content", "")
    kwargs = doc.get("additional_kwargs", {})

    if role == "human":
        return HumanMessage(content=content, additional_kwargs=kwargs)
    elif role == "ai":
        return AIMessage(content=content, additional_kwargs=kwargs)
    elif role == "system":
        return SystemMessage(content=content, additional_kwargs=kwargs)
    elif role == "tool":
        return ToolMessage(content=content, tool_call_id=kwargs.get("tool_call_id", ""), additional_kwargs=kwargs)
    return HumanMessage(content=content)


class ConversationMemoryStore:
    """Manages chat conversations and sliding-window context history."""

    async def create_session(
        self,
        user_id: str,
        user_role: str,
        model_provider: str,
        initial_title: str = "New Conversation",
    ) -> str:
        """Create a new conversation session record."""
        db = get_mongo_db()
        now = datetime.now(timezone.utc)
        doc = {
            "userId": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
            "userRole": user_role,
            "modelProvider": model_provider,
            "title": initial_title,
            "messages": [],
            "messageCount": 0,
            "createdAt": now,
            "updatedAt": now,
        }
        res = await db[COLLECTION_NAME].insert_one(doc)
        return str(res.inserted_id)

    async def append_message(self, conversation_id: str, message: BaseMessage) -> None:
        """Append a single message to an existing conversation."""
        db = get_mongo_db()
        now = datetime.now(timezone.utc)
        serialized = serialize_langchain_message(message)

        await db[COLLECTION_NAME].update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$push": {"messages": serialized},
                "$inc": {"messageCount": 1},
                "$set": {"updatedAt": now},
            },
        )

    async def get_recent_messages(
        self,
        conversation_id: str,
        limit: int = DEFAULT_WINDOW_LIMIT,
    ) -> List[BaseMessage]:
        """Fetch the most recent N messages using a sliding window."""
        db = get_mongo_db()
        doc = await db[COLLECTION_NAME].find_one(
            {"_id": ObjectId(conversation_id)},
            {"messages": {"$slice": -limit}},
        )
        if not doc or "messages" not in doc:
            return []

        return [deserialize_langchain_message(m) for m in doc["messages"]]

    async def list_user_sessions(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """List active conversation summaries for a user."""
        db = get_mongo_db()
        query = {"userId": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id}
        cursor = (
            db[COLLECTION_NAME]
            .find(query, {"messages": 0})
            .sort("updatedAt", -1)
            .skip(skip)
            .limit(limit)
        )
        sessions = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("userId"), ObjectId):
                doc["userId"] = str(doc["userId"])
            sessions.append(doc)
        return sessions

    async def update_title(self, conversation_id: str, title: str) -> None:
        """Update conversation title."""
        db = get_mongo_db()
        await db[COLLECTION_NAME].update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"title": title, "updatedAt": datetime.now(timezone.utc)}},
        )

    async def delete_session(self, conversation_id: str, user_id: str) -> bool:
        """Delete a conversation if owned by the user."""
        db = get_mongo_db()
        uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        res = await db[COLLECTION_NAME].delete_one({"_id": ObjectId(conversation_id), "userId": uid})
        return res.deleted_count > 0


conversation_memory = ConversationMemoryStore()
