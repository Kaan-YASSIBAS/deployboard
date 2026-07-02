from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, SecretStr


class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=32,
        pattern=r"^[a-z0-9_-]+$",
    )
    password: SecretStr = Field(min_length=8)


class LoginRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=32,
        pattern=r"^[a-z0-9_-]+$",
    )
    password: SecretStr = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class CurrentUserResponse(BaseModel):
    id: str
    username: str
    created_at: datetime
