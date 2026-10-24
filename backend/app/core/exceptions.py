"""Domain errors raised by services. Routes translate them into HTTP responses,
so services never need to know about HTTP status codes.
"""


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""
