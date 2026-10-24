"""Authentication endpoints. Login and /me are added in later cycles."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_auth_service
from app.core.exceptions import EmailAlreadyRegisteredError
from app.db.models import User
from app.schemas.user import UserCreate, UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    """Register a normal user. Returns 409 if the email is already taken."""
    try:
        return auth.register_user(payload.email, payload.password)
    except EmailAlreadyRegisteredError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc
