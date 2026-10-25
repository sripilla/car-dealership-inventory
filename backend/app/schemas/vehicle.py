"""Request and response shapes for vehicles."""

from pydantic import BaseModel, ConfigDict


class VehicleCreate(BaseModel):
    """Body of POST /api/vehicles."""

    make: str
    model: str
    category: str
    price: int  # whole rupees
    quantity: int


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
