from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.user import User
from app.models.terminal import Terminal
from app.models.route import Route
from app.models.trip import Trip
from app.models.seat import Seat
from app.models.reservation import Reservation

__all__ = [
    "User",
    "Terminal",
    "Route",
    "Trip",
    "Seat",
    "Reservation",
]
