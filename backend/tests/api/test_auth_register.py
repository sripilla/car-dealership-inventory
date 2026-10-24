
def test_register_returns_created_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "siri@example.com",
            "password": "SecurePassword123!",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert isinstance(data["id"], int)
    assert data["email"] == "siri@example.com"
    assert data["is_admin"] is False


def test_register_does_not_expose_password_fields(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "siri@example.com",
            "password": "SecurePassword123!",
        },
    )

    assert response.status_code == 201
    assert set(response.json().keys()) == {"id", "email", "is_admin"}
