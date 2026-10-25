"""API tests for the vehicle endpoints."""

import pytest
from sqlalchemy import func, select

from app.db.models import Vehicle

VEHICLES_URL = "/api/vehicles"
SEARCH_URL = "/api/vehicles/search"


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


def create_vehicle(client, headers, **overrides):
    """Create a vehicle through the API and return its JSON body."""
    response = client.post(
        VEHICLES_URL,
        json=valid_payload(**overrides),
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def test_list_vehicles_with_empty_database_returns_empty_list(client, auth_headers):
    response = client.get(VEHICLES_URL, headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_list_vehicles_returns_all_in_id_order(client, auth_headers):
    first = create_vehicle(client, auth_headers, make="Toyota")
    second = create_vehicle(client, auth_headers, make="Honda", quantity=0)
    third = create_vehicle(client, auth_headers, make="Ford")

    response = client.get(VEHICLES_URL, headers=auth_headers)

    assert response.status_code == 200

    body = response.json()
    assert [vehicle["id"] for vehicle in body] == [
        first["id"],
        second["id"],
        third["id"],
    ]
    assert body[1]["quantity"] == 0


def test_list_vehicles_without_token_returns_401(client):
    response = client.get(VEHICLES_URL)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("make", ["toy", "TOYOTA", "yot"])
def test_search_by_make_is_partial_and_case_insensitive(client, auth_headers, make):
    toyota = create_vehicle(client, auth_headers, make="Toyota")
    create_vehicle(client, auth_headers, make="Honda")

    response = client.get(
        SEARCH_URL,
        params={"make": make},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert [vehicle["id"] for vehicle in response.json()] == [toyota["id"]]


def test_search_by_make_without_token_returns_401(client):
    response = client.get(
        SEARCH_URL,
        params={"make": "toy"},
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_search_by_make_treats_percent_as_literal(client, auth_headers):
    create_vehicle(client, auth_headers, make="Toyota")
    create_vehicle(client, auth_headers, make="Honda")

    response = client.get(
        SEARCH_URL,
        params={"make": "%"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


def test_search_by_model_is_partial_and_case_insensitive(client, auth_headers):
    camry = create_vehicle(client, auth_headers, make="Toyota", model="Camry")
    create_vehicle(client, auth_headers, make="Honda", model="Civic")

    response = client.get(
        SEARCH_URL,
        params={"model": "cam"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert [vehicle["id"] for vehicle in response.json()] == [camry["id"]]


def test_search_by_category_returns_exact_matches(client, auth_headers):
    suv = create_vehicle(client, auth_headers, make="Toyota", category="SUV")
    create_vehicle(client, auth_headers, make="Honda", category="Sedan")

    response = client.get(
        SEARCH_URL,
        params={"category": "SUV"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert [vehicle["id"] for vehicle in response.json()] == [suv["id"]]


@pytest.mark.parametrize("category", ["suv", "Truck"])
def test_search_by_invalid_category_returns_422(client, auth_headers, category):
    response = client.get(
        SEARCH_URL,
        params={"category": category},
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("params", "expected_prices"),
    [
        ({"min_price": 2000000}, [2000000, 3000000]),
        ({"max_price": 2000000}, [1000000, 2000000]),
        (
            {"min_price": 1500000, "max_price": 2500000},
            [2000000],
        ),
    ],
    ids=["min only", "max only", "both bounds"],
)
def test_search_by_price_range_is_inclusive(client, auth_headers, params, expected_prices):
    for price in (1000000, 2000000, 3000000):
        create_vehicle(client, auth_headers, price=price)

    response = client.get(
        SEARCH_URL,
        params=params,
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert [vehicle["price"] for vehicle in response.json()] == (expected_prices)


def test_search_with_min_price_greater_than_max_price_returns_422(client, auth_headers):
    response = client.get(
        SEARCH_URL,
        params={"min_price": 3000000, "max_price": 1000000},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_search_with_non_numeric_min_price_returns_422(client, auth_headers):
    response = client.get(
        SEARCH_URL,
        params={"min_price": "abc"},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_search_combined_filters_returns_only_matching_vehicles(client, auth_headers):
    camry = create_vehicle(
        client,
        auth_headers,
        make="Toyota",
        model="Camry",
        category="Sedan",
    )
    create_vehicle(
        client,
        auth_headers,
        make="Toyota",
        model="Fortuner",
        category="SUV",
    )
    create_vehicle(
        client,
        auth_headers,
        make="Honda",
        model="City",
        category="Sedan",
    )

    response = client.get(
        SEARCH_URL,
        params={"make": "toy", "category": "Sedan"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert [vehicle["id"] for vehicle in response.json()] == [camry["id"]]


def test_search_with_no_matches_returns_empty_list(client, auth_headers):
    create_vehicle(client, auth_headers, make="Toyota")

    response = client.get(
        SEARCH_URL,
        params={"make": "Ferrari"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


def test_search_without_parameters_returns_all_vehicles_in_id_order(client, auth_headers):
    first = create_vehicle(client, auth_headers, make="Toyota")
    second = create_vehicle(client, auth_headers, make="Honda")
    third = create_vehicle(client, auth_headers, make="Ford")

    response = client.get(SEARCH_URL, headers=auth_headers)

    assert response.status_code == 200
    assert [vehicle["id"] for vehicle in response.json()] == [
        first["id"],
        second["id"],
        third["id"],
    ]


@pytest.mark.parametrize(
    ("name", "value"),
    [("colour", "red"), ("modle", "cam")],
    ids=["unknown filter", "typo of model"],
)
def test_search_with_unknown_parameter_returns_422(client, auth_headers, name, value):
    response = client.get(
        SEARCH_URL,
        params={name: value},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_update_vehicle_changes_only_supplied_fields(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(
        url,
        json={"price": 4200000},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == vehicle | {"price": 4200000}

    list_response = client.get(VEHICLES_URL, headers=auth_headers)
    saved_vehicle = next(item for item in list_response.json() if item["id"] == vehicle["id"])
    assert saved_vehicle["price"] == 4200000


def test_update_vehicle_with_empty_body_changes_nothing(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(
        url,
        json={},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == vehicle


def test_update_vehicle_without_token_returns_401(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(url, json={"price": 4200000})

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_update_unknown_vehicle_returns_404(client, auth_headers):
    response = client.put(
        f"{VEHICLES_URL}/999",
        json={"price": 4200000},
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Vehicle not found"}


@pytest.mark.parametrize(
    "body",
    [
        {"price": 0},
        {"price": -1},
        {"quantity": -1},
        {"make": ""},
        {"model": "   "},
        {"price": "2"},
    ],
    ids=[
        "price zero",
        "price negative",
        "quantity negative",
        "empty make",
        "whitespace-only model",
        "numeric string price",
    ],
)
def test_update_vehicle_with_invalid_value_returns_422(client, auth_headers, body):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(url, json=body, headers=auth_headers)

    assert response.status_code == 422


def test_update_vehicle_with_invalid_category_returns_422(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(
        url,
        json={"category": "Truck"},
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "field",
    ["make", "model", "category", "price", "quantity"],
)
def test_update_vehicle_with_null_field_returns_422(client, auth_headers, field):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(
        url,
        json={field: None},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_update_vehicle_trims_surrounding_whitespace(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    url = f"{VEHICLES_URL}/{vehicle['id']}"

    response = client.put(
        url,
        json={"make": "  Honda "},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["make"] == "Honda"
