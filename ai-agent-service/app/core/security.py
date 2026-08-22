"""
Security, JWT verification, and Role-Based Access Control (RBAC).
"""

from dataclasses import dataclass
from typing import Optional
import jwt
from fastapi import Request

from app.core.config import settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.logger import logger


@dataclass(frozen=True)
class AuthenticatedUser:
    """Immutable representation of an authenticated user payload."""
    user_id: str
    role: str  # 'student' | 'teacher' | 'admin' | 'super_admin'
    email: Optional[str] = None

    @property
    def is_super_admin(self) -> bool:
        return self.role == "super_admin"

    @property
    def is_admin(self) -> bool:
        return self.role in ("admin", "super_admin")

    @property
    def is_teacher(self) -> bool:
        return self.role in ("teacher", "admin", "super_admin")


def verify_bearer_token(request: Request) -> AuthenticatedUser:
    """
    Extract, decode and validate JWT Bearer token from request headers or httpOnly cookies.
    """
    token = ""
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif "accessToken" in request.cookies:
        token = request.cookies.get("accessToken", "").strip()

    if not token:
        raise AuthenticationError("Authorization token is missing")
    try:
        payload = jwt.decode(
            token,
            settings.jwt_access_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("userId")
        role = payload.get("role", "student")
        email = payload.get("email")

        if not user_id:
            raise AuthenticationError("Invalid JWT token: userId missing")

        return AuthenticatedUser(user_id=str(user_id), role=role, email=email)

    except jwt.ExpiredSignatureError:
        raise AuthenticationError("JWT token has expired")
    except jwt.InvalidTokenError as err:
        logger.warning(f"Failed JWT verification attempt: {err}")
        raise AuthenticationError(f"Invalid authentication token: {str(err)}")


def enforce_super_admin(user: AuthenticatedUser) -> None:
    """Enforce strict super_admin role."""
    if not user.is_super_admin:
        raise AuthorizationError("Operation restricted strictly to Super Administrator")


def enforce_admin(user: AuthenticatedUser) -> None:
    """Enforce admin or super_admin role."""
    if not user.is_admin:
        raise AuthorizationError("Operation restricted to Platform Administrators")
