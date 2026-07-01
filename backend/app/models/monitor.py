from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field, HttpUrl


class MonitorStatus(str, Enum):
    UNKNOWN = "UNKNOWN"
    UP = "UP"
    DOWN = "DOWN"
    DEGRADED = "DEGRADED"


class MonitorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    url: HttpUrl
    expected_status: int = Field(default=200, ge=100, le=599)
    check_interval_seconds: int = Field(default=300, ge=60, le=86400)


class Monitor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    url: HttpUrl
    expected_status: int = 200
    check_interval_seconds: int = 300
    status: MonitorStatus = MonitorStatus.UNKNOWN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MonitorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    url: HttpUrl | None = None
    expected_status: int | None = Field(default=None, ge=100, le=599)
    check_interval_seconds: int | None = Field(default=None, ge=60, le=86400)