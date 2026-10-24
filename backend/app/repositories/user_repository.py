"""Database access for users. No business rules live here."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User


class UserRepository:
    """Reads and writes User rows using the session it is given."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        """Return the user with this primary key, or None."""
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Return the user with exactly this email, or None.

        Callers pass an already-normalised (lowercased) email.
        """
        return self.db.scalar(select(User).where(User.email == email))

    def create(self, email: str, hashed_password: str) -> User:
        """Insert a user and return it with database-generated fields loaded."""
        user = User(email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)  # load id and created_at, which the database filled in
        return user
