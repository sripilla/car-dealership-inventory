"""API tests for the vehicle endpoints."""

from sqlalchemy import func, select

from app.db.models import Vehicle

VEHICLES_URL = "/api/vehicles"


def test_create_vehicle_with_valid_data_returns_201(client, auth_headers):
    payload = {
        "make": "Toyota",
        "model": "Camry",
        "category": "Sedan",
        "price": 3500000,
        "quantity": 2,
    }

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 201

    body = response.json()

    assert isinstance(body["id"], int)
    assert body["id"] > 0
    assert {key: body[key] for key in payload} == payload


def test_create_vehicle_without_token_returns_401(client, db_session):
    payload = {
        "make": "Toyota",
        "model": "Camry",
        "category": "Sedan",
        "price": 3500000,
        "quantity": 2,
    }

    response = client.post(VEHICLES_URL, json=payload)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"

    count = db_session.scalar(select(func.count()).select_from(Vehicle))
    assert count == 0
