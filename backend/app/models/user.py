from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    username: str = Field(
        min_length=3,
        max_length=32,
        pattern=r"^[a-z0-9_-]+$",
    )
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
