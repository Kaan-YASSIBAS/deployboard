from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.repositories.user_repository import DuplicateUsernameError
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.security import create_access_token, get_current_user
from app.services.auth_service import AuthService, get_auth_service


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _current_user_response(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        username=user.username,
        created_at=user.created_at,
    )


@router.post(
    "/register",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        user = service.register_user(
            username=payload.username,
            password=payload.password.get_secret_value(),
        )
    except DuplicateUsernameError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered",
        ) from exc

    return _current_user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
):
    user = service.authenticate_user(
        username=payload.username,
        password=payload.password.get_secret_value(),
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user.username))


@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return _current_user_response(current_user)
