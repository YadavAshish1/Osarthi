"""
FastAPI Dependency Injections for Authentication and Authorization.
"""

from fastapi import Request, Depends
from app.core.security import verify_bearer_token, enforce_super_admin, enforce_admin, AuthenticatedUser


def get_current_user(request: Request) -> AuthenticatedUser:
    """Dependency: Extract and validate JWT Bearer token."""
    return verify_bearer_token(request)


def get_current_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """Dependency: Require Administrator access."""
    enforce_admin(user)
    return user


def get_current_super_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """Dependency: Require Super Administrator access."""
    enforce_super_admin(user)
    return user
