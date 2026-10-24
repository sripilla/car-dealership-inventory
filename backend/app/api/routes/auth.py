"""Authentication endpoints. /me is added in the next cycle."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_auth_service
from app.core.exceptions import EmailAlreadyRegisteredError, InvalidCredentialsError
from app.core.security import create_access_token
from app.db.models import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserOut
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


@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    """Exchange an email and password for a bearer token. Returns 401 if they don't match."""
    try:
        user = auth.authenticate_user(payload.email, payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            # Standard header for 401s on bearer-token APIs.
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return Token(access_token=create_access_token(str(user.id)))
