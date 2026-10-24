from app.core.security import hash_password, verify_password


def test_hash_password_differs_from_plain_password():
    password = "SecurePassword123!"

    hashed = hash_password(password)

    assert hashed != password


def test_verify_password_accepts_correct_password():
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_rejects_wrong_password():
    password = "SecurePassword123!"
    hashed = hash_password(password)

    assert verify_password("WrongPassword456!", hashed) is False


def test_hash_password_salts_each_hash():
    password = "SecurePassword123!"

    first_hash = hash_password(password)
    second_hash = hash_password(password)

    assert first_hash != second_hash


def test_salted_hashes_verify_correct_password():
    password = "SecurePassword123!"

    first_hash = hash_password(password)
    second_hash = hash_password(password)

    assert verify_password(password, first_hash) is True
    assert verify_password(password, second_hash) is True
