"""Vehicle endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_vehicle_service, require_admin
from app.core.exceptions import OutOfStockError, VehicleNotFoundError
from app.db.models import Vehicle
from app.schemas.vehicle import (
    RestockRequest,
    VehicleCreate,
    VehicleOut,
    VehicleSearchFilters,
    VehicleUpdate,
)
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def _not_found(exc: VehicleNotFoundError) -> HTTPException:
    """The 404 every vehicle route returns for an unknown id."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Vehicle not found",
    )


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
        raise _not_found(exc) from exc


# require_admin runs before the handler, so a normal user gets 403 even for
# an unknown id: the response never reveals which ids exist to non-admins.
@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_vehicle(
    vehicle_id: int,
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> None:
    """Delete a vehicle. Admin only (403 for other users, 401 without a token);
    404 if the id is unknown. Returns 204 with no body.
    """
    try:
        vehicles.delete_vehicle(vehicle_id)
    except VehicleNotFoundError as exc:
        raise _not_found(exc) from exc


# POST, not PUT: a purchase is an action that changes stock, not a
# replacement of the vehicle. Any logged-in user may buy.
@router.post(
    "/{vehicle_id}/purchase",
    response_model=VehicleOut,
    dependencies=[Depends(get_current_user)],
)
def purchase_vehicle(
    vehicle_id: int,
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> Vehicle:
    """Buy one unit of a vehicle and return it with the reduced stock.
    Returns 400 if it is out of stock. Requires a logged-in user.
    """
    try:
        return vehicles.purchase_vehicle(vehicle_id)
    except VehicleNotFoundError as exc:
        raise _not_found(exc) from exc
    except OutOfStockError as exc:
        # 400: the request can't be fulfilled until the vehicle is restocked.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is out of stock",
        ) from exc


# Admin only, like delete: require_admin runs first, so a normal user gets
# 403 even for an unknown id.
@router.post(
    "/{vehicle_id}/restock",
    response_model=VehicleOut,
    dependencies=[Depends(require_admin)],
)
def restock_vehicle(
    vehicle_id: int,
    payload: RestockRequest,
    vehicles: Annotated[VehicleService, Depends(get_vehicle_service)],
) -> Vehicle:
    """Add stock to a vehicle. Admin only; 404 if unknown; 422 if quantity < 1."""
    try:
        return vehicles.restock_vehicle(vehicle_id, payload.quantity)
    except VehicleNotFoundError as exc:
        raise _not_found(exc) from exc
