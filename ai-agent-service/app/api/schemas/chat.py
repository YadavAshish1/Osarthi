from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class ChatRequestSchema(BaseModel):
    """Payload for submitting a chat query to the AI Agent (In-Memory / Zero DB Storage)."""
    message: str = Field(..., min_length=1, max_length=15000, description="User prompt or academic doubt")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Recent in-memory chat history from active browser session")
    conversation_id: Optional[str] = Field(None, description="Client session tag")
    model_provider: Optional[str] = Field(None, description="Preferred provider: 'azure_openai', 'gemini', or 'openai'")


class ConversationTitleUpdateSchema(BaseModel):
    """Payload for updating a conversation title."""
    title: str = Field(..., min_length=1, max_length=120)
