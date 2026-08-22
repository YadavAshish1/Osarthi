"""
Azure OpenAI Service Provider implementation.
Credentials are read strictly from server environment variables (.env).
"""

from typing import List
from langchain_core.language_models import BaseChatModel
from langchain_openai import AzureChatOpenAI

from app.core.config import settings
from app.llm.base import BaseLLMProvider


class AzureOpenAIProvider(BaseLLMProvider):
    """Azure OpenAI chat model adapter."""

    @property
    def provider_id(self) -> str:
        return "azure_openai"

    @property
    def display_name(self) -> str:
        return "Azure OpenAI"

    def is_configured(self) -> bool:
        return bool(
            settings.azure_openai_api_key
            and settings.azure_openai_endpoint
            and settings.azure_openai_api_key not in ("your-azure-api-key", "")
        )

    def get_supported_models(self) -> List[str]:
        return [settings.azure_openai_deployment_name, "gpt-4o", "gpt-4o-mini"]

    def get_chat_model(self, streaming: bool = True, temperature: float = 0.7) -> BaseChatModel:
        if not self.is_configured():
            raise ValueError("Azure OpenAI credentials (AZURE_OPENAI_API_KEY or AZURE_OPENAI_ENDPOINT) are missing from server environment")

        return AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            azure_deployment=settings.azure_openai_deployment_name,
            api_version=settings.azure_openai_api_version,
            temperature=temperature,
            streaming=streaming,
            max_tokens=4096,
        )
