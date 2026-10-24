"""Tests for POST /api/auth/login."""

from app.core.security import decode_access_token


def login(client, email, password):
    """Send a login request with the supplied credentials."""
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def test_login_returns_access_token(client, registered_user):
    response = login(
        client,
        registered_user["email"],
        registered_user["password"],
    )

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data["access_token"], str)
    assert data["access_token"]
    assert data["token_type"] == "bearer"
    assert decode_access_token(data["access_token"]) == str(registered_user["id"])


def test_login_rejects_wrong_password(client, registered_user):
    response = login(
        client,
        registered_user["email"],
        "WrongPassword456!",
    )

    assert response.status_code == 401


def test_login_rejects_unknown_email(client):
    response = login(
        client,
        "unknown@example.com",
        "SecurePassword123!",
    )

    assert response.status_code == 401


def test_login_uses_same_error_for_unknown_email_and_wrong_password(client, registered_user):
    wrong_password_response = login(
        client,
        registered_user["email"],
        "WrongPassword456!",
    )
    unknown_email_response = login(
        client,
        "unknown@example.com",
        "SecurePassword123!",
    )

    assert wrong_password_response.status_code == 401
    assert unknown_email_response.status_code == 401
    assert wrong_password_response.json()["detail"] == (unknown_email_response.json()["detail"])


def test_login_accepts_email_with_different_case(client, registered_user):
    response = login(
        client,
        registered_user["email"].upper(),
        registered_user["password"],
    )

    assert response.status_code == 200


def test_login_rejects_password_over_72_utf8_bytes(client, registered_user):
    password = "é" * 40

    assert len(password.encode("utf-8")) > 72

    response = login(
        client,
        registered_user["email"],
        password,
    )

    assert response.status_code == 401
