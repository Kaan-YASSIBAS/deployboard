from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.repositories.user_repository import MemoryUserRepository
from app.services import incident_service
from app.services.auth_service import AuthService, get_auth_service
from app.services.check_service import check_service
from app.services.monitor_service import monitor_service


class FakeResponse:
    def __init__(self, status_code):
        self.status_code = status_code


@pytest.fixture(autouse=True)
def reset_monitoring_storage():
    original_monitor_repository = monitor_service._repository
    original_check_repository = check_service._repository
    original_incident_repository = incident_service._repository

    monitor_service._repository = None
    monitor_service._monitors.clear()
    check_service._repository = None
    check_service._checks.clear()
    incident_service._repository = None
    incident_service.incidents.clear()

    yield

    monitor_service._monitors.clear()
    monitor_service._repository = original_monitor_repository
    check_service._checks.clear()
    check_service._repository = original_check_repository
    incident_service.incidents.clear()
    incident_service._repository = original_incident_repository


@pytest.fixture
def client():
    auth_service = AuthService(repository=MemoryUserRepository())
    app.dependency_overrides[get_auth_service] = lambda: auth_service
    test_client = TestClient(app)

    yield test_client

    test_client.close()
    app.dependency_overrides.pop(get_auth_service, None)


def register_and_login(client, username):
    password = f"{username}-password"
    registration = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password},
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert login.status_code == 200

    return registration.json(), {
        "Authorization": f"Bearer {login.json()['access_token']}"
    }


def create_monitor(client, headers, name="Example"):
    return client.post(
        "/api/v1/monitors",
        headers=headers,
        json={
            "name": name,
            "url": "https://example.com",
            "expected_status": 200,
            "check_interval_seconds": 300,
        },
    )


def test_health_remains_public(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.parametrize(
    "path",
    [
        pytest.param("/api/v1/monitors", id="monitors"),
        pytest.param("/api/v1/incidents", id="incidents"),
        pytest.param("/api/v1/incidents/active", id="active-incidents"),
    ],
)
def test_protected_list_endpoints_require_authentication(client, path):
    response = client.get(path)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_users_cannot_access_each_others_monitors(client):
    user_a, headers_a = register_and_login(client, "user-a")
    _, headers_b = register_and_login(client, "user-b")

    create_response = create_monitor(client, headers_a)
    assert create_response.status_code == 201
    monitor = create_response.json()
    assert monitor["user_id"] == user_a["id"]

    assert client.get("/api/v1/monitors", headers=headers_b).json() == []

    protected_requests = [
        client.get(f"/api/v1/monitors/{monitor['id']}", headers=headers_b),
        client.patch(
            f"/api/v1/monitors/{monitor['id']}",
            headers=headers_b,
            json={"name": "Changed"},
        ),
        client.delete(f"/api/v1/monitors/{monitor['id']}", headers=headers_b),
        client.post(
            f"/api/v1/monitors/{monitor['id']}/check",
            headers=headers_b,
        ),
        client.get(
            f"/api/v1/monitors/{monitor['id']}/checks",
            headers=headers_b,
        ),
    ]

    assert all(response.status_code == 404 for response in protected_requests)
    assert all(
        response.json()["detail"] == "Monitor not found"
        for response in protected_requests
    )
    assert (
        client.get(f"/api/v1/monitors/{monitor['id']}", headers=headers_a).status_code
        == 200
    )


def test_owner_can_check_monitor_and_read_ttl_history(client, monkeypatch):
    user_a, headers_a = register_and_login(client, "user-a")
    _, headers_b = register_and_login(client, "user-b")
    monitor = create_monitor(client, headers_a).json()
    monkeypatch.setattr(
        "app.services.check_service.httpx.get",
        lambda *args, **kwargs: FakeResponse(200),
    )

    check_response = client.post(
        f"/api/v1/monitors/{monitor['id']}/check",
        headers=headers_a,
    )

    assert check_response.status_code == 200
    check = check_response.json()
    checked_at = datetime.fromisoformat(check["checked_at"])
    expected_expiry = int(
        (checked_at + timedelta(days=settings.check_history_ttl_days)).timestamp()
    )
    assert check["user_id"] == user_a["id"]
    assert isinstance(check["expires_at"], int)
    assert abs(check["expires_at"] - expected_expiry) <= 1

    history_response = client.get(
        f"/api/v1/monitors/{monitor['id']}/checks",
        headers=headers_a,
    )
    assert history_response.status_code == 200
    assert [item["id"] for item in history_response.json()] == [check["id"]]

    cross_user_history = client.get(
        f"/api/v1/monitors/{monitor['id']}/checks",
        headers=headers_b,
    )
    assert cross_user_history.status_code == 404
    assert cross_user_history.json()["detail"] == "Monitor not found"


def test_incident_lifecycle_is_scoped_to_owner(client, monkeypatch):
    _, headers_a = register_and_login(client, "user-a")
    _, headers_b = register_and_login(client, "user-b")
    monitor = create_monitor(client, headers_a).json()
    responses = iter([FakeResponse(500), FakeResponse(500), FakeResponse(200)])
    monkeypatch.setattr(
        "app.services.check_service.httpx.get",
        lambda *args, **kwargs: next(responses),
    )

    check_url = f"/api/v1/monitors/{monitor['id']}/check"
    assert client.post(check_url, headers=headers_a).status_code == 200
    assert client.post(check_url, headers=headers_a).status_code == 200

    active_incidents = client.get(
        "/api/v1/incidents/active",
        headers=headers_a,
    ).json()
    assert len(active_incidents) == 1
    assert active_incidents[0]["status"] == "ACTIVE"
    assert client.get("/api/v1/incidents", headers=headers_b).json() == []

    assert client.post(check_url, headers=headers_a).status_code == 200
    assert client.get("/api/v1/incidents/active", headers=headers_a).json() == []
    incidents = client.get("/api/v1/incidents", headers=headers_a).json()
    assert len(incidents) == 1
    assert incidents[0]["status"] == "RESOLVED"
    assert incidents[0]["resolved_at"] is not None


def test_deleting_monitor_resolves_only_owner_incident(client, monkeypatch):
    _, headers_a = register_and_login(client, "user-a")
    _, headers_b = register_and_login(client, "user-b")
    monitor_a = create_monitor(client, headers_a, name="Service A").json()
    monitor_b = create_monitor(client, headers_b, name="Service B").json()
    monkeypatch.setattr(
        "app.services.check_service.httpx.get",
        lambda *args, **kwargs: FakeResponse(500),
    )

    assert (
        client.post(
            f"/api/v1/monitors/{monitor_a['id']}/check",
            headers=headers_a,
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/v1/monitors/{monitor_b['id']}/check",
            headers=headers_b,
        ).status_code
        == 200
    )

    delete_response = client.delete(
        f"/api/v1/monitors/{monitor_a['id']}",
        headers=headers_a,
    )
    assert delete_response.status_code == 204

    incidents_a = client.get("/api/v1/incidents", headers=headers_a).json()
    active_incidents_b = client.get(
        "/api/v1/incidents/active",
        headers=headers_b,
    ).json()
    assert incidents_a[0]["status"] == "RESOLVED"
    assert len(active_incidents_b) == 1
    assert active_incidents_b[0]["monitor_id"] == monitor_b["id"]


def test_monitor_limit_is_enforced_per_user(client, monkeypatch):
    monitor_limit = 2
    monkeypatch.setattr(settings, "max_monitors_per_user", monitor_limit)
    _, headers_a = register_and_login(client, "user-a")
    _, headers_b = register_and_login(client, "user-b")

    for index in range(monitor_limit):
        response = create_monitor(client, headers_a, name=f"Service {index + 1}")
        assert response.status_code == 201

    limit_response = create_monitor(client, headers_a, name="Service over limit")
    assert limit_response.status_code == 400
    assert (
        limit_response.json()["detail"]
        == f"Monitor limit of {monitor_limit} reached"
    )
    assert create_monitor(client, headers_b, name="Service B").status_code == 201
