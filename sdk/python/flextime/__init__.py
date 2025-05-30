"""
Flextime Python SDK

Official Python SDK for the Flextime API.
"""

__version__ = "1.0.0"

from .client import FlextimeClient
from .exceptions import (
    FlextimeError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    RateLimitError,
    ServerError,
)
from .types import (
    TimeEntry,
    Project,
    User,
    Report,
    CreateTimeEntryRequest,
    UpdateTimeEntryRequest,
    TimeEntryFilter,
)

__all__ = [
    "FlextimeClient",
    "FlextimeError",
    "AuthenticationError",
    "NotFoundError",
    "ValidationError",
    "RateLimitError",
    "ServerError",
    "TimeEntry",
    "Project",
    "User",
    "Report",
    "CreateTimeEntryRequest",
    "UpdateTimeEntryRequest",
    "TimeEntryFilter",
]