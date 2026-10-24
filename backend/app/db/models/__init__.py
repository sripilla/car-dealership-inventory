"""Every model is imported here, so importing app.db.models registers all
tables on Base.metadata. Tests (create_all) and Alembic (autogenerate) both
rely on this; add each new model to this file.
"""

from app.db.models.user import User

__all__ = ["User"]
