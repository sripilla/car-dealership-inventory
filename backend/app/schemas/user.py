"""Request and response shapes for user accounts.

Kept separate from the database model so the API never exposes stored-only
fields such as hashed_password.
"""

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    """Body of POST /api/auth/register. Validation rules arrive with their tests."""

    email: str
    password: str


class UserOut(BaseModel):
    """A user as returned by the API. Deliberately has no password field."""

    # Lets FastAPI build this directly from a SQLAlchemy User object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    is_admin: bool
