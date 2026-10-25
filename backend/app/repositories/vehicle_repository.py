"""Database access for vehicles. No business rules live here."""

from sqlalchemy import select
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

    def list_all(self) -> list[Vehicle]:
        """Return every vehicle, including out-of-stock ones, ordered by id.

        SQL guarantees no row order without ORDER BY (SQLite happens to use
        insertion order, Postgres doesn't), so the order is made explicit.
        """
        return list(self.db.scalars(select(Vehicle).order_by(Vehicle.id)))

    def search(
        self,
        *,
        make: str | None = None,
        model: str | None = None,
        category: str | None = None,
    ) -> list[Vehicle]:
        """Return vehicles matching every filter given, ordered by id.

        Text filters match anywhere in the value, ignoring case. autoescape
        makes % and _ match literally instead of acting as LIKE wildcards,
        so searching "%" doesn't return every vehicle. Category is an exact
        match; callers pass an already-validated value.
        """
        query = select(Vehicle).order_by(Vehicle.id)
        if make is not None:
            query = query.where(Vehicle.make.icontains(make, autoescape=True))
        if model is not None:
            query = query.where(Vehicle.model.icontains(model, autoescape=True))
        if category is not None:
            query = query.where(Vehicle.category == category)
        return list(self.db.scalars(query))
