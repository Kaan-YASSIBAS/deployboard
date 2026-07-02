from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.config import settings
from app.models.user import User
from app.services.auth_service import AuthService, get_auth_service


bearer_scheme = HTTPBearer(auto_error=False)


def _get_jwt_secret_key() -> str:
    if settings.jwt_secret_key is None:
        raise RuntimeError("JWT_SECRET_KEY must be configured outside development")

    return settings.jwt_secret_key.get_secret_value()


def create_access_token(
    username: str,
    expires_delta: timedelta | None = None,
) -> str:
    expires_at = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
    )
    payload = {
        "sub": username,
        "exp": expires_at,
    }
    return jwt.encode(
        payload,
        _get_jwt_secret_key(),
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> str:
    payload = jwt.decode(
        token,
        _get_jwt_secret_key(),
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub"]},
    )
    username = payload.get("sub")

    if not isinstance(username, str):
        raise InvalidTokenError("Invalid token subject")

    return username


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _credentials_exception()

    try:
        username = decode_access_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise _credentials_exception() from exc

    user = service.get_user_by_username(username)

    if user is None:
        raise _credentials_exception()

    return user
