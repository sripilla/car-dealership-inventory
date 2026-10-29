"""Application settings, loaded from environment variables or a .env file.

Keeping every setting in one typed object means the rest of the code never
reads os.environ directly, and tests can swap values in one place.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configurable values for the app. Defaults are for local development only."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./dealership.db"
    SECRET_KEY: str = "dev-only-insecure-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "change-me"
    # Browser origins allowed to call the API (the React dev server by
    # default). In .env, write it as JSON: CORS_ORIGINS=["https://my.app"]
    CORS_ORIGINS: list[str] = ["http://localhost:5173"] #the frontend origins allowed by CORS

#get settings returns one shared settings object so .env is read once
@lru_cache
def get_settings() -> Settings:
    """Return one shared Settings instance (cached so .env is read only once)."""
    return Settings()
