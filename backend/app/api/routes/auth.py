"""Authentication endpoints. Login and /me are added in later cycles."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Annotated[Session, Depends(get_db)]) -> User:
    """Create a normal (non-admin) user and return it without any password fields."""
    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)  # load id and created_at, which the database filled in
    return user
