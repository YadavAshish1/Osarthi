"""
Google Gemini Model Provider implementation.
Credentials are read strictly from server environment variables (.env).
"""

from typing import List, Optional
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings
from app.llm.base import BaseLLMProvider


class GoogleGeminiProvider(BaseLLMProvider):
    """Google Gemini chat model adapter."""

    @property
    def provider_id(self) -> str:
        return "gemini"

    @property
    def display_name(self) -> str:
        return "Google Gemini"

    def is_configured(self) -> bool:
        return bool(settings.gemini_api_key and settings.gemini_api_key not in ("your-gemini-api-key", ""))

    def get_supported_models(self) -> List[str]:
        return ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]

    def get_chat_model(
        self,
        streaming: bool = True,
        temperature: float = 0.7,
        model_name: Optional[str] = None,
    ) -> BaseChatModel:
        if not self.is_configured():
            raise ValueError("Google Gemini API key (GEMINI_API_KEY) is missing from server environment")

        chosen_model = model_name or settings.gemini_model_name

        return ChatGoogleGenerativeAI(
            model=chosen_model,
            google_api_key=settings.gemini_api_key,
            temperature=temperature,
            streaming=streaming,
            max_output_tokens=4096,
        )
