"""
Enterprise Configuration Management.
Uses Pydantic Settings for strictly typed configuration with environment parsing.
"""

from typing import Optional, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global Application Settings."""

    # ── Service Metadata ──
    app_name: str = "Medhashine AI Agent Service"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    port: int = 8000
    host: str = "0.0.0.0"

    # ── Networking & Security ──
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://localhost:3001"
    jwt_access_secret: str = "changeme"
    jwt_algorithm: str = "HS256"

    # ── Persistence (MongoDB) ──
    mongodb_uri: str = "mongodb://localhost:27017/osathi"
    mongodb_db_name: str = "osathi"

    # ── Vector Database (ChromaDB) ──
    chroma_persist_dir: str = "./chroma_data"
    chroma_collection_name: str = "osarthi_curriculum"

    # ── LLM Default Provider Selection ──
    default_llm_provider: str = "azure_openai"  # 'azure_openai' | 'gemini' | 'openai'

    # ── Azure OpenAI Provider ──
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_deployment_name: str = "gpt-4o"
    azure_openai_api_version: str = "2024-10-21"
    azure_openai_embedding_deployment: str = "text-embedding-3-small"

    # ── Google Gemini Provider ──
    gemini_api_key: Optional[str] = None
    gemini_model_name: str = "gemini-3.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"

    # ── OpenAI Direct Provider ──
    openai_api_key: Optional[str] = None
    openai_model_name: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    # ── Azure Cloud Infrastructure & Operations (Super Admin) ──
    azure_subscription_id: Optional[str] = None
    azure_resource_group: Optional[str] = None
    azure_tenant_id: Optional[str] = None
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def cors_origin_list(self) -> List[str]:
        """Return list of allowed CORS origins."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_azure_ops_configured(self) -> bool:
        """Check if Azure subscription and resource group are configured."""
        return bool(self.azure_subscription_id and self.azure_resource_group)


settings = Settings()
