"""The users table."""
#model- how data is stored
from datetime import datetime

from sqlalchemy import String, false, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """A registered account. Admins are created only by the seed script."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    # 320 is the longest valid email address. unique=True makes the database
    # itself reject duplicates, even if two requests race past the app's check.
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    # default= applies when the ORM inserts; server_default= also covers rows
    # inserted any other way (raw SQL, migrations), so no user is ever NULL here.
    is_admin: Mapped[bool] = mapped_column(default=False, server_default=false())
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
