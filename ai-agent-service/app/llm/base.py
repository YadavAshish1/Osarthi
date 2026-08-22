"""
Abstract Base Classes and Interfaces for LLM Providers.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from langchain_core.language_models import BaseChatModel


class BaseLLMProvider(ABC):
    """Abstract interface that every LLM provider must implement."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier of the provider (e.g. 'azure_openai', 'gemini', 'openai')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider name."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the required credentials and endpoints are present."""
        pass

    @abstractmethod
    def get_chat_model(self, streaming: bool = True, temperature: float = 0.7) -> BaseChatModel:
        """Build and return an initialized LangChain chat model instance."""
        pass

    @abstractmethod
    def get_supported_models(self) -> List[str]:
        """List available model/deployment identifiers."""
        pass
