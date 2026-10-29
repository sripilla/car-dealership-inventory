"""Request and response shapes for user accounts.

Kept separate from the database model so the API never exposes stored-only
fields such as hashed_password.
"""
#what the api accepts and return - schema


from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import MAX_PASSWORD_BYTES

MIN_PASSWORD_LENGTH = 8


class UserCreate(BaseModel):
    """Body of POST /api/auth/register."""

    email: EmailStr
    password: str = Field(min_length=MIN_PASSWORD_LENGTH)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt_limit(cls, value: str) -> str:
        """Reject passwords over 72 bytes. Bytes, not characters: "é" is 2 bytes."""
        if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(f"Password must be at most {MAX_PASSWORD_BYTES} bytes")
        return value


class LoginRequest(BaseModel):
    """Body of POST /api/auth/login.

    Plain strings on purpose: any wrong credentials, well-formed or not,
    get the same 401, so the response never hints at why login failed.
    """

    email: str
    password: str


class Token(BaseModel):
    """Response of POST /api/auth/login."""

    access_token: str
    # OAuth2 convention: tells the client to send "Authorization: Bearer <token>".
    token_type: str = "bearer"


class UserOut(BaseModel):
    """A user as returned by the API. Deliberately has no password field."""

    # Lets FastAPI build this directly from a SQLAlchemy User object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    is_admin: bool
