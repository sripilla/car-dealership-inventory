"""Alembic migration environment.

Connects Alembic to the app: the database URL comes from Settings (.env),
and the schema to compare against comes from Base.metadata.

"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

import app.db.models  # noqa: F401  (registers every table for autogenerate)
from app.core.config import get_settings
from app.db.base import Base

# Models must be imported so their tables register on Base.metadata,
# otherwise autogenerate sees an empty schema. Added once the first model exists.
config = context.config

# Use the same DATABASE_URL as the app, so migrations can never target a different DB.
# '%' is escaped because Alembic's config parser treats it as interpolation syntax
# (matters for Postgres URLs with URL-encoded passwords).
config.set_main_option("sqlalchemy.url", get_settings().DATABASE_URL.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Generate SQL scripts without connecting to a database."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Connect to the database and apply migrations."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        # SQLite can't ALTER most column changes; batch mode rebuilds the table instead.
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
