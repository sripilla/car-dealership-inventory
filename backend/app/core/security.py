"""Security helpers: password hashing now, JWT tokens in the next step."""

import bcrypt


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
    """
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
