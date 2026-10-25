"""Domain errors raised by services. Routes and scripts translate them into
responses, so services never need to know about HTTP status codes.
"""


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""


class InvalidCredentialsError(Exception):
    """Raised when the email is unknown or the password is wrong.

    One error for both cases, so callers can't reveal which emails exist.
    """


class AdminSeedConflictError(Exception):
    """Raised when the admin email already belongs to a normal user.

    The seed refuses to promote that account: whoever registered it first
    would otherwise gain admin rights with their own password.
    """


class VehicleNotFoundError(Exception):
    """Raised when no vehicle has the requested id."""
