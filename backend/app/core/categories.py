"""The vehicle categories the dealership sells.

A domain fact rather than an API detail, so it lives in core: the request
schemas, the search route and seed data all import it from here.
"""

from enum import StrEnum


class VehicleCategory(StrEnum):
    """Allowed values for Vehicle.category. Matching is exact and case-sensitive,
    because the UI sends them from a dropdown.

    "Electric" is a powertrain rather than a body type, but it is kept as its
    own category so EVs can be browsed together, as in the UI design.
    """

    SEDAN = "Sedan"
    SUV = "SUV"
    HATCHBACK = "Hatchback"
    ELECTRIC = "Electric"
