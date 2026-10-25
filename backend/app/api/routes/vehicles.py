"""Vehicle endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_vehicle_service
from app.core.exceptions import VehicleNotFoundError
from app.db.models import Vehicle
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleOut,
    VehicleSearchFilters,
    VehicleUpdate,
)
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


# Declared before any "/{id}" routes, so "search" can never be read as an id
# if a GET /{id} route is added later.
@router.get(
    "/search",
    response_model=list[VehicleOut],
    dependencies=[Depends(get_current_user)],
)
def search_vehicles(
    filters: Annotated[VehicleSearchFilters, Query()],
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> list[Vehicle]:
    """Search vehicles by make or model (partial, case-insensitive), category
    (exact) or price range (inclusive). Filters combine with AND. Requires a
    logged-in user.
    """
    return vehicles.search_vehicles(filters)


# PUT as named in the spec, with PATCH-like partial-update behaviour: only the
# fields sent are changed (see VehicleService.update_vehicle).
@router.put(
    "/{vehicle_id}",
    response_model=VehicleOut,
    dependencies=[Depends(get_current_user)],
)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> Vehicle:
    """Update some or all of a vehicle's fields. Returns 404 if the id is unknown.
    Requires a logged-in user.
    """
    try:
        return vehicles.update_vehicle(vehicle_id, payload)
    except VehicleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        ) from exc
