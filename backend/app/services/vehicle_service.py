"""Business rules for vehicles."""

from app.core.exceptions import OutOfStockError, VehicleNotFoundError
from app.db.models import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleSearchFilters, VehicleUpdate


class VehicleService:
    """Applies the vehicle rules; leaves HTTP to routes and SQL to the repository."""

    def __init__(self, vehicles: VehicleRepository) -> None:
        self.vehicles = vehicles

    def create_vehicle(self, data: VehicleCreate) -> Vehicle:
        """Add a vehicle to the inventory. Input is already validated by the schema."""
        return self.vehicles.create(**data.model_dump())

    def list_vehicles(self) -> list[Vehicle]:
        """Return all vehicles. Out-of-stock ones are included on purpose: the UI
        shows them with a disabled Purchase button.
        """
        return self.vehicles.list_all()

    def search_vehicles(self, filters: VehicleSearchFilters) -> list[Vehicle]:
        """Return vehicles matching the given filters (combined with AND)."""
        return self.vehicles.search(**filters.model_dump())

    def update_vehicle(self, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
        """Apply a partial update: only fields the client sent are changed.

        exclude_unset=True drops fields that were omitted from the request,
        so they keep their current values; {} therefore changes nothing.
        Raises VehicleNotFoundError if no vehicle has this id.
        """
        vehicle = self._get_or_raise(vehicle_id)
        return self.vehicles.update(vehicle, data.model_dump(exclude_unset=True))

    def delete_vehicle(self, vehicle_id: int) -> None:
        """Remove a vehicle. Raises VehicleNotFoundError if no vehicle has this id.

        Who may delete is decided by the route (admin only), not here.
        """
        self.vehicles.delete(self._get_or_raise(vehicle_id))

    def purchase_vehicle(self, vehicle_id: int) -> Vehicle:
        """Buy one unit of a vehicle, reducing its stock by one.

        Raises VehicleNotFoundError if no vehicle has this id, and
        OutOfStockError if its stock is 0 (the stock is left unchanged).
        The stock check and the decrement happen in one database step
        (see VehicleRepository.decrement_stock), so the API can't oversell.
        """
        vehicle = self._get_or_raise(vehicle_id)
        # Checked here, not only in the UI: the API can be called directly,
        # and stock must never go below 0.
        if not self.vehicles.decrement_stock(vehicle):
            raise OutOfStockError(vehicle_id)
        return vehicle

    def _get_or_raise(self, vehicle_id: int) -> Vehicle:
        """Return the vehicle with this id, or raise VehicleNotFoundError."""
        vehicle = self.vehicles.get_by_id(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(vehicle_id)
        return vehicle
