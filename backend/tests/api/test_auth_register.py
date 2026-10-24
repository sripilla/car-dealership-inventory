"""Tests for POST /api/auth/register."""

VALID_USER = {"email": "siri@example.com", "password": "SecurePassword123!"}


def register(client, **overrides):
    """POST a registration, starting from VALID_USER with any fields overridden."""
    return client.post("/api/auth/register", json={**VALID_USER, **overrides})


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
