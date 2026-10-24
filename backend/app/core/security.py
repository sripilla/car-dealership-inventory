"""Security helpers: password hashing and JWT access tokens."""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import get_settings

# HMAC-SHA256: one shared secret signs and verifies. Enough for a single backend.
ALGORITHM = "HS256"

# bcrypt only reads the first 72 bytes of a password, and the bcrypt library
# raises an error beyond that. Registration rejects longer passwords.
MAX_PASSWORD_BYTES = 72


class InvalidTokenError(Exception):
    """Raised when an access token is expired, tampered with or malformed.

    The app's own error type, so callers such as get_current_user never
    depend on PyJWT's exception classes.
    """


def hash_password(plain_password: str) -> str:
    """Return a salted bcrypt hash of the password, safe to store in the database.

    gensalt() creates a new random salt on every call, and bcrypt embeds that
    salt inside the returned hash. That is why the same password hashes
    differently each time but can still be verified later.
    """
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plain password matches the stored bcrypt hash.

    checkpw reads the salt back out of the stored hash, re-hashes the input
    with it, and compares the two in constant time (so response timing
    doesn't leak how many characters matched).

    A password over MAX_PASSWORD_BYTES can never have been registered, so it
    is reported as a mismatch instead of being passed to bcrypt.
    """
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        return False
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Return a signed JWT whose "sub" claim is the subject (the user's id).

    Expires after ACCESS_TOKEN_EXPIRE_MINUTES unless expires_delta is given
    (tests pass a negative delta to create an already-expired token).
    """
    settings = get_settings()
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    now = datetime.now(UTC)
    payload = {"sub": subject, "iat": now, "exp": now + expires_delta}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """Verify the token and return its subject.

    Raises InvalidTokenError if the signature doesn't match, the token has
    expired, required claims are missing, or it isn't a JWT at all.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            # Pin the algorithm: never trust the token's own header to choose it,
            # which blocks "alg: none" and algorithm-confusion attacks.
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise InvalidTokenError("Invalid or expired token") from exc
    return payload["sub"]
