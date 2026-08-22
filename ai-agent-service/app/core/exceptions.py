"""
Domain and Infrastructure Exceptions for the AI Agent service.
"""

class OsarthiAIException(Exception):
    """Base exception for all Osarthi AI errors."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthenticationError(OsarthiAIException):
    """Raised when JWT token verification fails."""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=401)


class AuthorizationError(OsarthiAIException):
    """Raised when an unauthorized role tries to invoke a protected tool/endpoint."""
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, status_code=403)


class ProviderUnavailableError(OsarthiAIException):
    """Raised when an LLM provider is not configured or fails to initialize."""
    def __init__(self, message: str = "Requested LLM provider is unavailable"):
        super().__init__(message, status_code=503)


class RAGIngestionError(OsarthiAIException):
    """Raised when document chunking or vector indexing fails."""
    def __init__(self, message: str = "RAG ingestion failure"):
        super().__init__(message, status_code=500)
