"""
Medhashine AI Agent Service — FastAPI Entrypoint.
Delegates to the modern, modular enterprise architecture in app.main.
"""

from app.main import app, create_application

__all__ = ["app", "create_application"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
