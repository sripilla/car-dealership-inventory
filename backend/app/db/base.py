"""Declarative base class that every SQLAlchemy model inherits from.

Alembic reads Base.metadata to know which tables exist.
"""
#base is an empty parent class every model inherits from- inhereting from it registers the class as a table
#SQL alchemy is an object relation mapper which maps python classes into SQL tables
#Alembic reads the metadata and campares it with real databases and writes migrations for the diff
#and the tests uses it to create tables

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Parent class for all database models."""
