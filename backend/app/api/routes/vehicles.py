"""Vehicle endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user, get_vehicle_service
from app.db.models import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleOut
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


# "" rather than "/": the URL is exactly /api/vehicles, matching the spec,
# with no trailing-slash redirect.
# dependencies=: the route requires a logged-in user but doesn't use it,
# so there's no unused current_user parameter.
@router.post(
    "",
    response_model=VehicleOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def create_vehicle(
    payload: VehicleCreate,
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> Vehicle:
    """Add a vehicle to the inventory. Requires a logged-in user (401 otherwise)."""
    return vehicles.create_vehicle(payload)


@router.get(
    "",
    response_model=list[VehicleOut],
    dependencies=[Depends(get_current_user)],
)
def list_vehicles(
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> list[Vehicle]:
    """List every vehicle, including out-of-stock ones. Requires a logged-in user."""
    return vehicles.list_vehicles()
