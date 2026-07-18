from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_auth_me_requires_token():
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_admin_ping_requires_token():
    response = client.get("/admin/ping")
    assert response.status_code == 401
