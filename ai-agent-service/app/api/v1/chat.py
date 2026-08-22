"""
Chat API Endpoint with SSE (Server-Sent Events) streaming.
Pure in-memory execution with Zero MongoDB storage overhead.
"""

import json
from typing import List
from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from app.core.config import settings
from app.core.logger import logger
from app.core.security import AuthenticatedUser
from app.api.dependencies import get_current_user
from app.api.schemas.chat import ChatRequestSchema
from app.agent.orchestrator import agent_orchestrator

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", summary="Stream chat response using Server-Sent Events (SSE) — Zero DB Storage")
async def stream_chat(
    body: ChatRequestSchema,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Accepts user prompt and streams AI agent reasoning tokens via SSE.
    Operates purely in-memory (No MongoDB storage footprint).
    """
    chosen_provider = body.model_provider or settings.default_llm_provider
    client_session_id = body.conversation_id or "live-session"

    # Reconstruct message chain from client in-memory history
    chain: List[BaseMessage] = []
    if body.history:
        for item in body.history[-8:]:  # Sliding window of last 8 in-memory turns
            role = item.get("role", "user")
            content = item.get("content", "")
            if role in ["user", "human"]:
                chain.append(HumanMessage(content=content))
            elif role in ["ai", "assistant"]:
                chain.append(AIMessage(content=content))

    # Append current message if not already the last item
    if not chain or chain[-1].content != body.message:
        chain.append(HumanMessage(content=body.message))

    async def sse_event_generator():
        yield {
            "event": "metadata",
            "data": json.dumps({
                "conversation_id": client_session_id,
                "model_provider": chosen_provider,
            }),
        }

        try:
            async for token in agent_orchestrator.astream_agent_response(
                user=user,
                messages=chain,
                preferred_provider=body.model_provider,
            ):
                yield {
                    "event": "token",
                    "data": json.dumps({"token": token}),
                }

            yield {
                "event": "done",
                "data": json.dumps({"conversation_id": client_session_id}),
            }

        except Exception as err:
            logger.error(f"SSE generator stream failure: {err}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(err)}),
            }

    return EventSourceResponse(sse_event_generator())
