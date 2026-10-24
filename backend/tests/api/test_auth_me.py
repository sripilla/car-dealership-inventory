"""Tests for GET /api/auth/me."""

from datetime import timedelta

from app.core.security import create_access_token


def test_me_returns_current_user(client, registered_user, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200

    data = response.json()
    assert data == {
        "id": registered_user["id"],
        "email": registered_user["email"],
        "is_admin": False,
    }


def test_me_rejects_missing_token(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_rejects_garbage_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-token"},
    )

    assert response.status_code == 401


def test_me_rejects_expired_token(client, registered_user):
    token = create_access_token(
        str(registered_user["id"]),
        expires_delta=timedelta(minutes=-1),
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_me_rejects_token_for_nonexistent_user(client):
    token = create_access_token("999999")

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_me_rejects_wrong_authentication_scheme(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Basic abc"},
    )

    assert response.status_code == 401


def test_me_missing_token_response_includes_bearer_challenge(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.headers.get("www-authenticate") == "Bearer"
