"""API tests for the vehicle endpoints."""

import pytest
from sqlalchemy import func, select

from app.db.models import Vehicle

VEHICLES_URL = "/api/vehicles"


def valid_payload(**overrides):
    """A valid vehicle body; pass keyword arguments to change single fields."""
    return {
        "make": "Toyota",
        "model": "Camry",
        "category": "Sedan",
        "price": 3500000,
        "quantity": 2,
    } | overrides


def test_create_vehicle_with_valid_data_returns_201(client, auth_headers):
    payload = valid_payload()

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
    payload = valid_payload()

    response = client.post(VEHICLES_URL, json=payload)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"

    count = db_session.scalar(select(func.count()).select_from(Vehicle))
    assert count == 0


@pytest.mark.parametrize(
    "field",
    ["make", "model", "category", "price", "quantity"],
)
def test_create_vehicle_missing_field_returns_422(client, auth_headers, field):
    payload = valid_payload()
    del payload[field]

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("price", [0, -1])
def test_create_vehicle_with_invalid_price_returns_422(client, auth_headers, price):
    payload = valid_payload(price=price)

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_vehicle_with_price_one_returns_201(client, auth_headers):
    payload = valid_payload(price=1)

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["price"] == 1


def test_create_vehicle_with_negative_quantity_returns_422(client, auth_headers):
    payload = valid_payload(quantity=-1)

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_vehicle_with_zero_quantity_returns_201(client, auth_headers):
    payload = valid_payload(quantity=0)

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["quantity"] == 0


@pytest.mark.parametrize("field", ["make", "model"])
def test_create_vehicle_with_empty_string_returns_422(client, auth_headers, field):
    payload = valid_payload(**{field: ""})

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("field", ["make", "model"])
def test_create_vehicle_with_whitespace_only_string_returns_422(client, auth_headers, field):
    payload = valid_payload(**{field: "   "})

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("field", ["make", "model"])
def test_create_vehicle_trims_surrounding_whitespace(client, auth_headers, field):
    payload = valid_payload(**{field: "  Toyota "})

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()[field] == "Toyota"


@pytest.mark.parametrize("field", ["price", "quantity"])
def test_create_vehicle_with_numeric_string_returns_422(client, auth_headers, field):
    payload = valid_payload(**{field: "2"})

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "category",
    ["Truck", "sedan", ""],
)
def test_create_vehicle_with_invalid_category_returns_422(client, auth_headers, category):
    payload = valid_payload(category=category)

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "category",
    ["Sedan", "SUV", "Hatchback", "Electric"],
)
def test_create_vehicle_accepts_each_allowed_category(client, auth_headers, category):
    payload = valid_payload(category=category)

    response = client.post(
        VEHICLES_URL,
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["category"] == category
