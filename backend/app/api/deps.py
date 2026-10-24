"""FastAPI dependencies shared by routes.

get_current_user and require_admin are added in later cycles.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService


def get_auth_service(db: Annotated[Session, Depends(get_db)]) -> AuthService:
    """Build an AuthService for this request, using the request's database session."""
    return AuthService(UserRepository(db))
