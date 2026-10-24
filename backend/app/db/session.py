"""Database engine, session factory and the get_db dependency."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# SQLite only allows the thread that opened a connection to use it by default.
# FastAPI may handle a request on a different thread, so we turn that check off.
# Other databases (e.g. Postgres) don't need this, so it's applied only for SQLite.
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """Give each request its own session and always close it afterwards.

    Tests override this dependency to point at a temporary test database.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
