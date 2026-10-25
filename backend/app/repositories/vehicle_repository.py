"""Database access for vehicles. No business rules live here."""

from sqlalchemy import ColumnElement, select
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
        min_price: int | None = None,
        max_price: int | None = None,
    ) -> list[Vehicle]:
        """Return vehicles matching every filter given (AND), ordered by id.

        With no filters this returns every vehicle, like list_all.
        """
        conditions = _search_conditions(
            make=make,
            model=model,
            category=category,
            min_price=min_price,
            max_price=max_price,
        )
        # .where() with several conditions joins them with AND; with none it
        # adds no WHERE clause at all.
        query = select(Vehicle).where(*conditions).order_by(Vehicle.id)
        return list(self.db.scalars(query))


def _search_conditions(
    *,
    make: str | None,
    model: str | None,
    category: str | None,
    min_price: int | None,
    max_price: int | None,
) -> list[ColumnElement[bool]]:
    """Turn the given filters into SQL conditions; filters left as None are skipped.

    Text filters match anywhere in the value, ignoring case. autoescape makes
    % and _ match literally instead of acting as LIKE wildcards, so searching
    "%" doesn't return every vehicle. Category is an exact match; callers pass
    an already-validated value. Both price bounds are inclusive. "is not None"
    rather than truthiness, so a bound of 0 is not skipped.
    """
    conditions: list[ColumnElement[bool]] = []
    if make is not None:
        conditions.append(Vehicle.make.icontains(make, autoescape=True))
    if model is not None:
        conditions.append(Vehicle.model.icontains(model, autoescape=True))
    if category is not None:
        conditions.append(Vehicle.category == category)
    if min_price is not None:
        conditions.append(Vehicle.price >= min_price)
    if max_price is not None:
        conditions.append(Vehicle.price <= max_price)
    return conditions
