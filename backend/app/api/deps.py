"""FastAPI dependencies shared by routes. require_admin is added in the next cycle."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import InvalidTokenError
from app.db.models import User
from app.db.session import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

# auto_error=False: we raise our own 401 instead of FastAPI's default error, so a
# missing header, a non-Bearer scheme and a bad token all get the same response.
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: Annotated[Session, Depends(get_db)]) -> AuthService:
    """Build an AuthService for this request, using the request's database session."""
    return AuthService(UserRepository(db))


def _credentials_error() -> HTTPException:
    """The one 401 every authentication failure returns."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    """Return the logged-in user from the "Authorization: Bearer <token>" header.

    Any problem (no header, wrong scheme, invalid or expired token, or a user
    that no longer exists) results in the same 401.
    """
    if credentials is None:  # header missing, or not a Bearer scheme
        raise _credentials_error()
    try:
        return auth.get_user_from_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise _credentials_error() from exc
