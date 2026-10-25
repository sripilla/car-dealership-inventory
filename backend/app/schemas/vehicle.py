"""Request and response shapes for vehicles."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# Whitespace is stripped *before* the length check, so "   " becomes "" and is
# rejected, and "  Toyota " is stored as "Toyota".
NonBlankStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class VehicleCreate(BaseModel):
    """Body of POST /api/vehicles."""

    make: NonBlankStr
    model: NonBlankStr
    category: str
    # strict=True: only real JSON integers are accepted. Pydantic's default
    # "lax" mode would turn "2" into 2 and true into 1.
    price: int = Field(gt=0, strict=True)  # whole rupees; a free car is a typo
    quantity: int = Field(ge=0, strict=True)  # 0 is valid: out of stock


class VehicleOut(BaseModel):
    """A vehicle as returned by the API."""

    # Lets FastAPI build this directly from a SQLAlchemy Vehicle object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: int
    quantity: int
