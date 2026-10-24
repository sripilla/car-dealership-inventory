"""Tests for POST /api/auth/register."""

import pytest

VALID_USER = {
    "email": "siri@example.com",
    "password": "SecurePassword123!",
}


def register(client, **overrides):
    """Register a user, allowing selected fields to be overridden."""
    return client.post(
        "/api/auth/register",
        json={**VALID_USER, **overrides},
    )


# Successful registration


def test_register_returns_created_user(client):
    response = register(client)

    assert response.status_code == 201

    data = response.json()
    assert isinstance(data["id"], int)
    assert data["email"] == VALID_USER["email"]
    assert data["is_admin"] is False


def test_register_does_not_expose_password_fields(client):
    response = register(client)

    assert response.status_code == 201
    assert set(response.json().keys()) == {"id", "email", "is_admin"}


# Duplicate emails


def test_register_rejects_duplicate_email(client):
    first_response = register(client)
    assert first_response.status_code == 201

    second_response = register(client)

    assert second_response.status_code == 409


def test_register_rejects_email_with_different_case(client):
    first_response = register(client)
    assert first_response.status_code == 201

    second_response = register(client, email="Siri@Example.com")

    assert second_response.status_code == 409


# Invalid input


@pytest.mark.parametrize(
    "email",
    ["not-an-email", "siri@", "@example.com"],
)
def test_register_rejects_invalid_email(client, email):
    response = register(client, email=email)

    assert response.status_code == 422


def test_register_rejects_password_shorter_than_8_characters(client):
    response = register(client, password="A" * 7)

    assert response.status_code == 422


def test_register_accepts_password_with_8_characters(client):
    response = register(client, password="A" * 8)

    assert response.status_code == 201


def test_register_accepts_password_with_72_ascii_bytes(client):
    password = "A" * 72

    response = register(client, password=password)

    assert response.status_code == 201


def test_register_rejects_password_with_73_ascii_bytes(client):
    password = "A" * 73

    response = register(client, password=password)

    assert response.status_code == 422


def test_register_rejects_password_over_72_utf8_bytes(client):
    password = "é" * 40

    assert len(password) < 72
    assert len(password.encode("utf-8")) == 80

    response = register(client, password=password)

    assert response.status_code == 422


# Admin privileges


def test_register_cannot_create_admin(client):
    response = register(client, is_admin=True)

    assert response.status_code == 201
    assert response.json()["is_admin"] is False
