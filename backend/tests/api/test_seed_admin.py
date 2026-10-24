"""Tests for the admin seed script."""

import pytest
from sqlalchemy import func, select

from app.core.config import Settings
from app.core.security import verify_password
from app.db.models import User
from app.seed_admin import AdminSeedConflictError, main, seed_admin


def test_seed_admin_creates_admin(db_session):
    user = seed_admin(
        db_session,
        "admin@example.com",
        "AdminPassword123!",
    )

    assert user.id is not None
    assert user.email == "admin@example.com"
    assert user.is_admin is True


def test_seeded_admin_can_log_in_and_access_me(db_session, client):
    password = "AdminPassword123!"

    seed_admin(db_session, "admin@example.com", password)

    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": password},
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@example.com"
    assert me_response.json()["is_admin"] is True


def test_seed_admin_is_idempotent(db_session):
    email = "admin@example.com"
    password = "AdminPassword123!"

    first_user = seed_admin(db_session, email, password)
    second_user = seed_admin(db_session, email, password)

    user_count = db_session.scalar(select(func.count()).select_from(User))

    assert first_user.id == second_user.id
    assert user_count == 1
    assert second_user.is_admin is True


def test_seed_admin_refuses_to_promote_existing_normal_user(db_session, client):
    email = "admin@example.com"
    password = "RegularPassword123!"

    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )

    assert response.status_code == 201

    with pytest.raises(AdminSeedConflictError):
        seed_admin(db_session, email, "AdminPassword123!")

    user = db_session.scalar(select(User).where(User.email == email))

    assert user is not None
    assert user.is_admin is False
    assert verify_password(password, user.hashed_password)


def test_seed_admin_normalizes_email(db_session, client):
    seed_admin(
        db_session,
        "Admin@Example.com",
        "AdminPassword123!",
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@example.com",
            "password": "AdminPassword123!",
        },
    )

    assert response.status_code == 200


def test_seed_admin_stores_hashed_password(db_session):
    password = "AdminPassword123!"

    user = seed_admin(db_session, "admin@example.com", password)

    assert user.hashed_password != password
    assert verify_password(password, user.hashed_password)


def test_main_returns_zero_on_success(db_session, monkeypatch, capsys):
    monkeypatch.setattr(
        "app.seed_admin.SessionLocal",
        lambda: db_session,
    )
    monkeypatch.setattr(
        "app.seed_admin.get_settings",
        lambda: Settings(
            ADMIN_EMAIL="admin@example.com",
            ADMIN_PASSWORD="AdminPassword123!",
        ),
    )

    result = main()

    captured = capsys.readouterr()

    assert result == 0
    assert "Admin ready" in captured.out


def test_main_returns_one_on_conflict(db_session, client, monkeypatch, capsys):
    email = "admin@example.com"
    password = "RegularPassword123!"

    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert response.status_code == 201

    monkeypatch.setattr(
        "app.seed_admin.SessionLocal",
        lambda: db_session,
    )
    monkeypatch.setattr(
        "app.seed_admin.get_settings",
        lambda: Settings(
            ADMIN_EMAIL=email,
            ADMIN_PASSWORD="AdminPassword123!",
        ),
    )

    result = main()

    captured = capsys.readouterr()

    assert result == 1
    assert "Refusing" in captured.err

    user = db_session.scalar(select(User).where(User.email == email))

    assert user is not None
    assert user.is_admin is False
    assert verify_password(password, user.hashed_password)
