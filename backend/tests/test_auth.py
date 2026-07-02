import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.user_repository import MemoryUserRepository
from app.services.auth_service import AuthService, get_auth_service


USERNAME = "kaan"
PASSWORD = "password123"


@pytest.fixture
def auth_service_instance():
    return AuthService(repository=MemoryUserRepository())


@pytest.fixture
def client(auth_service_instance):
    app.dependency_overrides[get_auth_service] = lambda: auth_service_instance

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def register_user(client):
    return client.post(
        "/api/v1/auth/register",
        json={"username": USERNAME, "password": PASSWORD},
    )


def login_user(client, password=PASSWORD):
    return client.post(
        "/api/v1/auth/login",
        json={"username": USERNAME, "password": password},
    )


def test_register_succeeds(client, auth_service_instance):
    response = register_user(client)

    assert response.status_code == 201
    assert set(response.json()) == {"id", "username", "created_at"}
    assert response.json()["username"] == USERNAME

    stored_user = auth_service_instance.get_user_by_username(USERNAME)
    assert stored_user is not None
    assert stored_user.password_hash != PASSWORD
    assert stored_user.password_hash.startswith("$argon2")


def test_duplicate_username_fails(client):
    assert register_user(client).status_code == 201

    response = register_user(client)

    assert response.status_code == 400
    assert response.json()["detail"] == "Username is already registered"


def test_login_succeeds(client):
    assert register_user(client).status_code == 201

    response = login_user(client)

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_with_wrong_password_fails(client):
    assert register_user(client).status_code == 201

    response = login_user(client, password="wrong-password")

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_me_returns_current_user_with_valid_token(client):
    register_response = register_user(client)
    token = login_user(client).json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == register_response.json()


def test_me_fails_without_token(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
