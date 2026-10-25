"""Database access for vehicles. No business rules live here."""

from sqlalchemy.orm import Session

from app.db.models import Vehicle


class VehicleRepository:
    """Reads and writes Vehicle rows using the session it is given."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, make: str, model: str, category: str, price: int, quantity: int) -> Vehicle:
        """Insert a vehicle and return it with database-generated fields loaded."""
        vehicle = Vehicle(make=make, model=model, category=category, price=price, quantity=quantity)
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)  # load id and created_at, which the database filled in
        return vehicle
