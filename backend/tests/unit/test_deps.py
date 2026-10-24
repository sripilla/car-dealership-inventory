"""Unit tests for authorization dependencies."""

import pytest
from fastapi import HTTPException

from app.api.deps import require_admin
from app.db.models import User


def test_require_admin_rejects_non_admin_user():
    user = User(
        email="user@example.com",
        hashed_password="hashed-password",
        is_admin=False,
    )

    with pytest.raises(HTTPException) as exc_info:
        require_admin(user)

    assert exc_info.value.status_code == 403


def test_require_admin_returns_admin_user():
    user = User(
        email="admin@example.com",
        hashed_password="hashed-password",
        is_admin=True,
    )

    result = require_admin(user)

    assert result is user


# API-level authorization tests (403 for a logged-in non-admin)
# will be added with the protected vehicle deletion endpoint in Phase 2.
