"""Shared pytest fixtures.

Every test gets a fresh, empty SQLite database in a temporary folder, so tests
never touch the real dealership.db and never depend on each other.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.db.models  # noqa: F401  (registers every table before create_all)
from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture
def db_session(tmp_path):
    """A session bound to a brand-new SQLite file that is deleted after the test."""
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def client(db_session):
    """A TestClient whose routes use the test database instead of the real one."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    email = "login@example.com"
    password = "SecurePassword123!"

    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert response.status_code == 201

    return {
        "id": response.json()["id"],
        "email": email,
        "password": password,
    }



@pytest.fixture
def auth_headers(client, registered_user):
    """Return authorization headers for a registered user."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )

    assert response.status_code == 200
    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}
