"""
Direct OpenAI Provider implementation.
Credentials are read strictly from server environment variables (.env).
"""

from typing import List, Optional
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.llm.base import BaseLLMProvider


class OpenAIDirectProvider(BaseLLMProvider):
    """Direct OpenAI chat model adapter."""

    @property
    def provider_id(self) -> str:
        return "openai"

    @property
    def display_name(self) -> str:
        return "OpenAI (Direct)"

    def is_configured(self) -> bool:
        return bool(settings.openai_api_key and settings.openai_api_key not in ("your-openai-api-key", ""))

    def get_supported_models(self) -> List[str]:
        return ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]

    def get_chat_model(
        self,
        streaming: bool = True,
        temperature: float = 0.7,
        model_name: Optional[str] = None,
    ) -> BaseChatModel:
        if not self.is_configured():
            raise ValueError("OpenAI API key (OPENAI_API_KEY) is missing from server environment")

        return ChatOpenAI(
            model=model_name or settings.openai_model_name,
            api_key=settings.openai_api_key,
            temperature=temperature,
            streaming=streaming,
            max_tokens=4096,
        )
