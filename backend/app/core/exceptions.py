"""Domain errors raised by services. Routes translate them into HTTP responses,
so services never need to know about HTTP status codes.
"""


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""


class InvalidCredentialsError(Exception):
    """Raised when the email is unknown or the password is wrong.

    One error for both cases, so callers can't reveal which emails exist.
    """
