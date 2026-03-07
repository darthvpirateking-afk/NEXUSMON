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


def test_get_missions_list_additive_read_model_available_on_both_surfaces():
    payload = {"type": "analysis", "payload": {"prompt": "list read model"}}

    with TestClient(nexusmon_app) as client_a:
        client_a.post("/api/missions", json=payload)
        a = _get_json(client_a, "/api/missions")

    with TestClient(runtime_app) as client_b:
        client_b.post("/api/missions", json=payload)
        b = _get_json(client_b, "/api/missions")

    for response in (a, b):
        assert "missions" in response
        assert "count" in response
        assert "items" in response
        assert "read_model_version" in response
        assert response["count"] == len(response["missions"])
        assert response["count"] == len(response["items"])
        if response["missions"]:
            mission = response["missions"][0]
            assert set(
                ("execution_backed", "execution_truth_label", "execution_truth_detail")
            ).issubset(set(mission.keys()))
        if response["items"]:
            item = response["items"][0]
            assert set(
                (
                    "id",
                    "mission_id",
                    "title",
                    "status",
                    "status_raw",
                    "source",
                    "truth",
                    "execution_backed",
                    "execution_truth_label",
                    "execution_truth_detail",
                )
            ).issubset(set(item.keys()))
            if item["execution_backed"] is True:
                assert item["execution_truth_label"] == "EXECUTION-BACKED"
            elif item["status"] in {"queued", "validating"}:
                assert item["execution_truth_label"] == "QUEUED RECORD"
                assert item["execution_truth_detail"] == "Queued in backend contract."
            else:
                assert item["execution_truth_label"] == "READ-MODEL ONLY"
                assert item["execution_truth_detail"] == "Display-only backend record."


def test_get_mission_detail_additive_read_model_available_on_both_surfaces():
    payload = {"type": "analysis", "payload": {"prompt": "detail read model"}}

    with TestClient(nexusmon_app) as client_a:
        created_a = client_a.post("/api/missions", json=payload).json()
        a = _get_json(client_a, f"/api/missions/{created_a['mission_id']}")

    with TestClient(runtime_app) as client_b:
        created_b = client_b.post("/api/missions", json=payload).json()
        b = _get_json(client_b, f"/api/missions/{created_b['mission_id']}")

    for response, mission_id in ((a, created_a["mission_id"]), (b, created_b["mission_id"])):
        assert response["mission_id"] == mission_id
        assert "mission" in response
        assert "read_model" in response
        assert response["read_model"]["mission_id"] == mission_id
        assert response["read_model"]["truth"] == "backend"


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
