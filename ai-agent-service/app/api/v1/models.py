"""
Models and LLM Providers API Endpoint.
"""

from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import AuthenticatedUser
from app.api.dependencies import get_current_user
from app.llm.factory import llm_factory

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", summary="List available LLM providers and active default")
async def list_models(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns list of LLM providers with runtime configuration status and active Admin Portal preference.
    """
    db_settings = None
    try:
        from app.core.database import get_mongo_db
        db = get_mongo_db()
        db_settings = await db["aisettings"].find_one({})
    except Exception:
        pass

    active_default = (db_settings.get("defaultProvider") if db_settings else None) or settings.default_llm_provider
    fallback_seq = (db_settings.get("fallbackSequence") if db_settings else None) or ["azure_openai", "gemini", "openai"]

    raw_providers = llm_factory.list_available_providers()
    providers = []
    for p in raw_providers:
        pid = p["id"]
        is_def = (pid == active_default)
        providers.append({
            **p,
            "is_default": is_def,
        })

    # Sort providers by fallback sequence
    providers.sort(key=lambda x: fallback_seq.index(x["id"]) if x["id"] in fallback_seq else 99)

    return {
        "providers": providers,
        "default": active_default,
        "fallback_sequence": fallback_seq,
    }
