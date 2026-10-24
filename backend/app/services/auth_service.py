"""Business rules for accounts: registration, authentication, token lookup
and the admin seed.
"""

from app.core.exceptions import (
    AdminSeedConflictError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
)
from app.core.security import (
    InvalidTokenError,
    decode_access_token,
    hash_password,
    verify_password,
)
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

    def authenticate_user(self, email: str, password: str) -> User:
        """Return the user if the email and password match.

        Raises InvalidCredentialsError for an unknown email or a wrong
        password alike, so the two cases are indistinguishable to callers.
        """
        user = self.users.get_by_email(email.lower())
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError
        return user

    def get_user_from_token(self, token: str) -> User:
        """Return the user an access token belongs to.

        Raises InvalidTokenError if the token is invalid or expired, or if it
        is validly signed but its user no longer exists (e.g. a deleted account).
        """
        subject = decode_access_token(token)
        # Tokens we issue always carry a numeric id; anything else can't match a user.
        user = self.users.get_by_id(int(subject)) if subject.isdigit() else None
        if user is None:
            raise InvalidTokenError("Token does not belong to an existing user")
        return user

    def ensure_admin(self, email: str, password: str) -> User:
        """Create the admin account, or return it if it already exists.

        Safe to run repeatedly. An existing admin is left unchanged (including
        its password). Raises AdminSeedConflictError if the email belongs to
        a normal user, because promoting them would give admin rights to
        whoever registered that email first.
        """
        email = email.lower()
        existing = self.users.get_by_email(email)
        if existing is not None:
            if existing.is_admin:
                return existing
            raise AdminSeedConflictError(email)
        return self.users.create(
            email=email,
            hashed_password=hash_password(password),
            is_admin=True,
        )
