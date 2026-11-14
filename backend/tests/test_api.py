import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ADMIN_API_KEY", "test-admin-key")

from app import deps  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from tests.memory_store import FakeGateway, MemoryStore  # noqa: E402

UID = "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def ctx():
    get_settings.cache_clear()
    os.environ["ADMIN_API_KEY"] = "test-admin-key"
    store = MemoryStore()
    store.insert_profile({"id": UID, "student_code": "RA-7A-01", "full_name": "Ayu", "class_name": "7A"})
    gw = FakeGateway(store)
    app.dependency_overrides[deps.get_store] = lambda: store
    app.dependency_overrides[deps.get_gateway] = lambda: gw
    deps.login_limiter.hits.clear()
    yield TestClient(app), store
    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_login_valid_code_case_insensitive(ctx):
    client, store = ctx
    r = client.post("/api/auth/login", json={"student_code": "  ra-7a-01 "})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["access_token"] == f"tok-{UID}" and body["profile"]["full_name"] == "Ayu"
    assert store.activity[-1]["activity_type"] == "login"


@pytest.mark.parametrize("code,status", [("", 422), ("ab", 422), ("RA 7A!", 422), ("RA-9Z-99", 401)])
def test_login_invalid(ctx, code, status):
    client, _ = ctx
    r = client.post("/api/auth/login", json={"student_code": code})
    assert r.status_code == status
    assert r.json()["detail"]


def test_login_rate_limited(ctx):
    client, _ = ctx
    codes = [client.post("/api/auth/login", json={"student_code": "NOPE-0000"}).status_code for _ in range(11)]
    assert codes[-1] == 429


def test_protected_endpoints_require_token(ctx):
    client, _ = ctx
    assert client.post("/api/sessions", json={"kind": "training", "ref_id": "level-1"}).status_code == 401
    r = client.post("/api/sessions", json={"kind": "training", "ref_id": "level-1"},
                    headers={"Authorization": "Bearer palsu"})
    assert r.status_code == 401
    r = client.post("/api/sessions", json={"kind": "training", "ref_id": "level-1"},
                    headers={"Authorization": "Bearer tok-tidak-terdaftar"})
    assert r.status_code == 403


def test_full_training_flow_over_http(ctx):
    client, store = ctx
    h = {"Authorization": f"Bearer tok-{UID}"}
    s = client.post("/api/sessions", json={"kind": "training", "ref_id": "level-2"}, headers=h).json()
    bad = client.post(f"/api/sessions/{s['id']}/answer", json={"index": 0, "answer": "abc"}, headers=h)
    assert bad.status_code == 422
    for i, _ in enumerate(s["items"]):
        key = store.sessions[s["id"]]["items"][i]["answer"]
        r = client.post(f"/api/sessions/{s['id']}/answer", json={"index": i, "answer": key, "reason": "pakai n²"},
                        headers=h)
        assert r.status_code == 200 and r.json()["correct"]
    res = client.post(f"/api/sessions/{s['id']}/finish", headers=h).json()
    assert res["percent"] == 100 and res["xp_awarded"] == 40
    got = client.get(f"/api/sessions/{s['id']}", headers=h).json()
    assert got["status"] == "finished" and got["result"]["percent"] == 100


def test_admin_requires_key_and_creates_student(ctx):
    client, store = ctx
    assert client.get("/api/admin/students").status_code == 401
    assert client.get("/api/admin/students", headers={"X-Admin-Key": "salah"}).status_code == 401
    h = {"X-Admin-Key": "test-admin-key"}
    r = client.post("/api/admin/students", json={"student_code": "ra-7b-05", "full_name": "Budi", "class_name": "7B"},
                    headers=h)
    assert r.status_code == 201 and r.json()["student_code"] == "RA-7B-05"
    dup = client.post("/api/admin/students", json={"student_code": "RA-7B-05", "full_name": "X"}, headers=h)
    assert dup.status_code == 409
    login = client.post("/api/auth/login", json={"student_code": "ra-7b-05"})
    assert login.status_code == 200
    assert len(client.get("/api/admin/students", headers=h).json()) == 2


def test_health(ctx):
    client, _ = ctx
    assert client.get("/api/health").json()["status"] == "ok"
