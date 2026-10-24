"""Business rules for accounts. Authentication is added in the login cycle."""

from app.core.exceptions import EmailAlreadyRegisteredError
from app.core.security import hash_password
from app.db.models import User
from app.repositories.user_repository import UserRepository


class AuthService:
    """Applies the account rules; leaves HTTP to routes and SQL to the repository."""

    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def register_user(self, email: str, password: str) -> User:
        """Create a normal (non-admin) user.

        Emails are case-insensitive, so they are stored lowercased:
        "Siri@Example.com" and "siri@example.com" are the same account.
        Raises EmailAlreadyRegisteredError if the email is already taken.
        """
        email = email.lower()
        if self.users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(email)
        return self.users.create(email=email, hashed_password=hash_password(password))
