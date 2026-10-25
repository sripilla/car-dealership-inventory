"""The vehicles table."""

from datetime import datetime

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Vehicle(Base):
    """A car the dealership sells; quantity is how many units are in stock."""

    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    # Plain text, not a database enum: the API schema enforces the allowed
    # values, so adding a category later needs no migration.
    category: Mapped[str] = mapped_column(String(50))
    # Whole rupees. SQLite has no exact decimal type, and car prices never
    # use paise, so an integer avoids float rounding entirely.
    price: Mapped[int]
    quantity: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
