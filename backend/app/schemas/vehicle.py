"""Request and response shapes for vehicles."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.core.categories import VehicleCategory

# Whitespace is stripped *before* the length check, so "   " becomes "" and is
# rejected, and "  Toyota " is stored as "Toyota".
NonBlankStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class VehicleCreate(BaseModel):
    """Body of POST /api/vehicles."""

    make: NonBlankStr
    model: NonBlankStr
    category: VehicleCategory
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
    # Plain str on output: rows are validated on the way in, and a response
    # should never fail just because the category list changed later.
    category: str
    price: int
    quantity: int


class VehicleSearchFilters(BaseModel):
    """Query parameters of GET /api/vehicles/search.

    Every filter is optional; the ones given are combined with AND.
    """

    make: str | None = None  # partial, case-insensitive
    model: str | None = None  # partial, case-insensitive
    # The enum rejects unknown or wrong-case values with 422, the same rule
    # as create, so a typo is reported instead of silently matching nothing.
    category: VehicleCategory | None = None
