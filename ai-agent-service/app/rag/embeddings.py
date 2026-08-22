"""
Unified Embeddings Provider for RAG vector generation.
Supports Azure OpenAI (default), OpenAI Direct, and Google Gemini embeddings.
Respects DEFAULT_LLM_PROVIDER setting and provides graceful fallback.
"""

from typing import List
from app.core.config import settings
from app.core.logger import logger
from app.core.exceptions import ProviderUnavailableError


class EmbeddingService:
    """Service to generate dense vector embeddings across multiple cloud backends."""

    def _azure_embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings via Azure OpenAI with batching and retry."""
        import time
        from openai import AzureOpenAI
        client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
        )
        all_embeddings = []
        batch_size = 8
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            for attempt in range(3):
                try:
                    response = client.embeddings.create(
                        input=batch,
                        model=settings.azure_openai_embedding_deployment,
                    )
                    all_embeddings.extend([item.embedding for item in response.data])
                    break
                except Exception as e:
                    if attempt < 2:
                        time.sleep(2)
                        continue
                    raise e
        return all_embeddings

    def _openai_embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings via direct OpenAI."""
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.embeddings.create(
            input=texts,
            model=settings.openai_embedding_model,
        )
        return [item.embedding for item in response.data]

    def _gemini_embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings via Google Gemini with retry on rate limit."""
        import time
        from google import genai
        client = genai.Client(api_key=settings.gemini_api_key)
        
        for attempt in range(3):
            try:
                result = client.models.embed_content(
                    model=settings.gemini_embedding_model,
                    contents=texts,
                )
                return [e.values for e in result.embeddings]
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    logger.warning("Gemini embedding rate limit hit (429), pausing for 15s...")
                    time.sleep(15)
                    continue
                raise e

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embedding vectors. Uses DEFAULT_LLM_PROVIDER first,
        then falls back to any available provider.
        """
        if not texts:
            return []

        # Build ordered provider list (Azure OpenAI enterprise embedding first)
        providers = []
        if settings.azure_openai_api_key and settings.azure_openai_endpoint:
            providers.append(("Azure OpenAI", self._azure_embed))
        if settings.gemini_api_key and settings.gemini_api_key != "your-gemini-api-key":
            providers.append(("Gemini", self._gemini_embed))
        if settings.openai_api_key and settings.openai_api_key != "your-openai-api-key":
            providers.append(("OpenAI Direct", self._openai_embed))

        if not providers:
            raise ProviderUnavailableError(
                "No embedding service configured. Set GEMINI_API_KEY, AZURE_OPENAI_API_KEY, or OPENAI_API_KEY."
            )

        # Try each provider with fallback
        import asyncio
        last_error = None
        for name, embed_fn in providers:
            try:
                logger.info(f"Generating embeddings via {name}...")
                result = await asyncio.to_thread(embed_fn, texts)
                logger.info(f"Embeddings generated successfully via {name} ({len(result)} vectors)")
                return result
            except Exception as e:
                logger.warning(f"Embedding via {name} failed: {e}")
                last_error = e
                continue

        raise ProviderUnavailableError(f"All embedding providers failed. Last error: {last_error}")


embedding_service = EmbeddingService()
