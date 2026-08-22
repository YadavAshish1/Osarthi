"""
Enterprise Application Factory and Entry Point for Osarthi AI Agent Service.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logger import logger
from app.core.database import init_mongo, close_mongo
from app.core.exceptions import OsarthiAIException
from app.api.v1.router import api_v1_router, legacy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version} [{settings.environment}]")
    await init_mongo()
    logger.info(f"Default LLM Provider: {settings.default_llm_provider}")
    yield
    logger.info("Gracefully shutting down services...")
    await close_mongo()
    logger.info("Shutdown completed.")


def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Enterprise Agentic AI Microservice with LLM, RAG, and MCP for Osarthi EdTech",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug or settings.environment != "production" else None,
        redoc_url="/redoc" if settings.debug or settings.environment != "production" else None,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Domain Exception Handler
    @app.exception_handler(OsarthiAIException)
    async def domain_exception_handler(request: Request, exc: OsarthiAIException):
        logger.warning(f"Domain exception on {request.url.path}: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "error", "message": exc.message},
        )

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health():
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        }

    # Mount API routers
    app.include_router(api_v1_router)
    app.include_router(legacy_router)

    return app


app = create_application()
