"""Request and response shapes for user accounts.

Kept separate from the database model so the API never exposes stored-only
fields such as hashed_password.
"""

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

MIN_PASSWORD_LENGTH = 8
# bcrypt only reads the first 72 bytes of a password and the bcrypt library
# raises an error beyond that, so longer passwords are rejected up front.
MAX_PASSWORD_BYTES = 72


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


class UserOut(BaseModel):
    """A user as returned by the API. Deliberately has no password field."""

    # Lets FastAPI build this directly from a SQLAlchemy User object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    is_admin: bool
