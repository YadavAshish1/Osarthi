"""
Aggregated v1 Router.
"""

from fastapi import APIRouter
from app.api.v1.chat import router as chat_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.models import router as models_router
from app.api.v1.rag import router as rag_router

# Modern versioned router (/api/v1/...)
api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(chat_router)
api_v1_router.include_router(conversations_router)
api_v1_router.include_router(models_router)
api_v1_router.include_router(rag_router)

# Legacy compatibility router (/api/agent/... and /api/rag/...)
legacy_router = APIRouter()
legacy_agent_router = APIRouter(prefix="/api/agent")
legacy_agent_router.include_router(chat_router, prefix="")
legacy_agent_router.include_router(conversations_router, prefix="")
legacy_agent_router.include_router(models_router, prefix="")

legacy_router.include_router(legacy_agent_router)
legacy_router.include_router(rag_router, prefix="/api")
