"""
Dynamic LLM Factory with automatic fallback cascading.
"""

from typing import Dict, List, Optional
from langchain_core.language_models import BaseChatModel

from app.core.config import settings
from app.core.exceptions import ProviderUnavailableError
from app.core.logger import logger
from app.llm.base import BaseLLMProvider
from app.llm.providers.azure_openai import AzureOpenAIProvider
from app.llm.providers.gemini import GoogleGeminiProvider
from app.llm.providers.openai_direct import OpenAIDirectProvider


class LLMFactory:
    """Factory service for creating and resolving configured LLM instances."""

    def __init__(self):
        self._providers: Dict[str, BaseLLMProvider] = {
            "azure_openai": AzureOpenAIProvider(),
            "gemini": GoogleGeminiProvider(),
            "openai": OpenAIDirectProvider(),
        }
        # Fallback chain: gemini (default active) -> secondary options
        self._fallback_order: List[str] = ["gemini", "openai", "azure_openai"]

    def list_available_providers(self) -> List[dict]:
        """Return list of all supported providers with their active configuration status."""
        results = []
        for pid, provider in self._providers.items():
            results.append({
                "id": pid,
                "name": provider.display_name,
                "is_configured": provider.is_configured(),
                "is_default": pid == settings.default_llm_provider,
                "supported_models": provider.get_supported_models(),
            })
        return results

    def get_provider(self, provider_id: Optional[str] = None) -> BaseLLMProvider:
        """Resolve requested or default provider."""
        pid = provider_id if provider_id in self._providers else settings.default_llm_provider
        provider = self._providers.get(pid)
        if not provider:
            raise ProviderUnavailableError(f"Unknown LLM provider: {pid}")
        return provider

    def build_chat_model(
        self,
        provider_id: Optional[str] = None,
        streaming: bool = True,
        temperature: float = 0.7,
    ) -> BaseChatModel:
        """
        Build and return a LangChain Chat Model.
        If the requested provider fails or is unconfigured, cascades down the fallback chain.
        """
        chosen_pid = provider_id if provider_id in self._providers else settings.default_llm_provider
        attempt_sequence = [chosen_pid] + [p for p in self._fallback_order if p != chosen_pid]

        for pid in attempt_sequence:
            provider = self._providers.get(pid)
            if provider and provider.is_configured():
                try:
                    chat_model = provider.get_chat_model(streaming=streaming, temperature=temperature)
                    if pid != chosen_pid:
                        logger.warning(f"Preferred provider '{chosen_pid}' was bypassed; using '{pid}' instead.")
                    else:
                        logger.info(f"Initialized LLM Chat Model using provider: {pid}")
                    return chat_model
                except Exception as err:
                    logger.error(f"Error instantiating provider '{pid}': {err}")

        raise ProviderUnavailableError(
            "No LLM provider could be initialized. Please configure valid Azure OpenAI, Gemini, or OpenAI API keys."
        )


llm_factory = LLMFactory()
