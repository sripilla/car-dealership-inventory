"""Business rules for vehicles."""

from app.core.exceptions import VehicleNotFoundError
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
        vehicle = self.vehicles.get_by_id(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(vehicle_id)
        return self.vehicles.update(vehicle, data.model_dump(exclude_unset=True))
