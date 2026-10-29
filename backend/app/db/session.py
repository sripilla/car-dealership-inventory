"""Database engine, session factory and the get_db dependency."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()


connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

#Engine creates from DATABASE.URL, knows which database type its talking to(SQLite)
#manages the actual connections alls reuse aswell.
#each new session borrows a connection from engine
#session is short-lived unit of work that tracks objects which are added or changed, sends the SQL commit and can roll back

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
#db.close runs even if the route raised an error