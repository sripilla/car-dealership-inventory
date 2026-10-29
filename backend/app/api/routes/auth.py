"""Authentication endpoints: register, login and the current user."""
#The request body is validated by the schema, the dependencies run (login, admin), it calls one service method,
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_auth_service, get_current_user
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


@router.get("/me", response_model=UserOut)
def read_me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Return the logged-in user. The frontend uses is_admin to show admin UI."""
    return current_user
