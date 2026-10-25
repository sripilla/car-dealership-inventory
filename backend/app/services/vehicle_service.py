"""Business rules for vehicles."""

from app.db.models import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleSearchFilters


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
