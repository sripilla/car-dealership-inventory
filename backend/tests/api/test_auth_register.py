
"""Tests for POST /api/auth/register."""

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
