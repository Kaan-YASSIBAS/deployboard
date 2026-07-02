from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field


class CheckStatus(str, Enum):
    UP = "UP"
    DOWN = "DOWN"


class CheckResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str | None = None
    monitor_id: str
    status: CheckStatus
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: int | None = None
    response_time_ms: int | None = None
    status_code: int | None = None
    error: str | None = None
