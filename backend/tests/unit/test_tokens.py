import base64
import json
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
)


def _b64url_decode(part: str) -> dict:
    padded = part + "=" * (-len(part) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))


def _b64url_encode(data: dict) -> str:
    raw = json.dumps(data, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def test_access_token_round_trip_returns_subject():
    subject = "42"

    token = create_access_token(subject)

    assert decode_access_token(token) == subject


def test_decode_access_token_rejects_expired_token():
    token = create_access_token(
        "42",
        expires_delta=timedelta(minutes=-1),
    )

    with pytest.raises(InvalidTokenError):
        decode_access_token(token)


def test_decode_access_token_rejects_token_with_altered_subject():
    token = create_access_token("42")
    header, payload, signature = token.split(".")

    decoded_payload = _b64url_decode(payload)
    decoded_payload["sub"] = "1"

    tampered_payload = _b64url_encode(decoded_payload)
    tampered_token = f"{header}.{tampered_payload}.{signature}"

    with pytest.raises(InvalidTokenError):
        decode_access_token(tampered_token)


def test_decode_access_token_rejects_wrong_signing_secret():
    forged_token = jwt.encode(
        {
            "sub": "42",
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        "a-different-secret-that-is-32-bytes-long",
        algorithm="HS256",
    )

    with pytest.raises(InvalidTokenError):
        decode_access_token(forged_token)


def test_decode_access_token_rejects_malformed_token():
    with pytest.raises(InvalidTokenError):
        decode_access_token("not-a-token")
