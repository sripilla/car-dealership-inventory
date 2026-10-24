"""Create the admin account from ADMIN_EMAIL and ADMIN_PASSWORD in .env.

Run from backend/ after `alembic upgrade head`:

    python -m app.seed_admin

Registration can never create an admin, so this script is the only way to
get one. It is safe to run more than once.
"""

import sys

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AdminSeedConflictError
from app.db.models import User
from app.db.session import SessionLocal
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

# AdminSeedConflictError is re-exported so callers can catch it from here.
__all__ = ["AdminSeedConflictError", "main", "seed_admin"]


def seed_admin(db: Session, email: str, password: str) -> User:
    """Ensure an admin with this email exists, using the given session.

    Tests call this directly with their temporary database session.
    """
    return AuthService(UserRepository(db)).ensure_admin(email, password)


def main() -> int:
    """Seed the admin from settings. Returns a process exit code."""
    settings = get_settings()
    db = SessionLocal()
    try:
        user = seed_admin(db, settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)
        print(f"Admin ready: {user.email} (id {user.id})")
        return 0
    except AdminSeedConflictError:
        print(
            f"Refusing: {settings.ADMIN_EMAIL} already belongs to a non-admin user. "
            "Use a different ADMIN_EMAIL or remove that account first.",
            file=sys.stderr,
        )
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
