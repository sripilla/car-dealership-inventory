"""Vehicle endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.deps import get_vehicle_service
from app.db.models import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleOut
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


# "" rather than "/": the URL is exactly /api/vehicles, matching the spec,
# with no trailing-slash redirect.
@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> Vehicle:
    """Add a vehicle to the inventory."""
    return vehicles.create_vehicle(payload)
