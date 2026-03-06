from __future__ import annotations

from fastapi.testclient import TestClient

from nexusmon_server import app as nexusmon_app
from swarmz_runtime.api.server import app as runtime_app


def _get_json(client: TestClient, path: str):
    response = client.get(path)
    assert response.status_code == 200
    return response.json()


def test_health_basic_available_on_both_surfaces():
    # Run sequentially — nested `with` blocks sharing storage can deadlock.
    with TestClient(nexusmon_app) as client_a:
        a = _get_json(client_a, "/api/health")
    with TestClient(runtime_app) as client_b:
        b = _get_json(client_b, "/api/health")
    assert set(a.keys()) == set(b.keys())


def test_post_missions_available_on_both_surfaces():
    payload = {"type": "analysis", "payload": {"prompt": "both surfaces"}}
    with TestClient(nexusmon_app) as client_a:
        a_resp = client_a.post("/api/missions", json=payload)
    with TestClient(runtime_app) as client_b:
        b_resp = client_b.post("/api/missions", json=payload)
    assert a_resp.status_code == 200
    assert b_resp.status_code == 200
    a = a_resp.json()
    b = b_resp.json()
    assert set(a.keys()) == set(b.keys())


def test_audit_available_on_both_surfaces():
    with TestClient(nexusmon_app) as client_a:
        a = _get_json(client_a, "/api/audit")
    with TestClient(runtime_app) as client_b:
        b = _get_json(client_b, "/api/audit")
    assert set(a.keys()) == set(b.keys())


def test_avatar_xp_available_on_both_surfaces():
    with TestClient(nexusmon_app) as client_a:
        a = _get_json(client_a, "/api/avatar/xp")
    with TestClient(runtime_app) as client_b:
        b = _get_json(client_b, "/api/avatar/xp")
    assert set(a.keys()) == set(b.keys())
