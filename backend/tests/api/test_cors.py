"""CORS: the React dev server runs on another origin (port 5173), so the
browser only lets it call the API if the API says that origin is allowed.
"""

import pytest

ALLOWED_ORIGIN = "http://localhost:5173"


def preflight(client, origin: str):
    """The OPTIONS request a browser sends before a cross-origin POST with JSON."""
    return client.options(
        "/api/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )


def test_preflight_from_the_frontend_origin_is_allowed(client):
    response = preflight(client, ALLOWED_ORIGIN)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    allowed_headers = response.headers["access-control-allow-headers"].lower()
    assert "authorization" in allowed_headers


@pytest.mark.parametrize(
    "origin",
    ["http://evil.example", "http://localhost:3000"],
    ids=["other-site", "other-local-port"],
)
def test_preflight_from_other_origins_is_not_allowed(client, origin):
    response = preflight(client, origin)

    assert "access-control-allow-origin" not in response.headers


def test_simple_request_from_the_frontend_gets_the_allow_origin_header(client):
    response = client.get("/health", headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
