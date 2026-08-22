"""
Conversations Management Endpoints (Stateless / Zero-DB Mode).
"""

from fastapi import APIRouter, Depends, Query
from app.core.security import AuthenticatedUser
from app.api.dependencies import get_current_user
from app.api.schemas.chat import ConversationTitleUpdateSchema

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", summary="List user conversation sessions (Stateless Mode)")
async def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: AuthenticatedUser = Depends(get_current_user),
):
    return {"conversations": []}


@router.delete("/{conversation_id}", summary="Delete conversation session")
async def delete_conversation(
    conversation_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    return {"status": "deleted", "conversation_id": conversation_id}


@router.put("/{conversation_id}/title", summary="Rename conversation title")
async def rename_conversation(
    conversation_id: str,
    body: ConversationTitleUpdateSchema,
    user: AuthenticatedUser = Depends(get_current_user),
):
    return {"status": "updated", "conversation_id": conversation_id, "title": body.title}
