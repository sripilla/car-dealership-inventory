"""Declarative base class that every SQLAlchemy model inherits from.

Alembic reads Base.metadata to know which tables exist.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Parent class for all database models."""
