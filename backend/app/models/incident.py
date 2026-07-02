from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class IncidentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"


class Incident(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    monitor_id: str
    monitor_name: str
    monitor_url: str
    status: IncidentStatus = IncidentStatus.ACTIVE
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    last_error: Optional[str] = None
    last_status_code: Optional[int] = None