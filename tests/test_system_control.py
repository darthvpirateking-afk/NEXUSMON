"""Tests for system control and mission lifecycle endpoints."""

import pytest
from fastapi.testclient import TestClient
from swarmz_runtime.api.server import app
from swarmz_runtime.operator.memory import OperatorMemory


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_system_status(client):
    resp = client.get("/v1/system/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "timestamp" in data


def test_system_heartbeat(client):
    resp = client.get("/v1/system/heartbeat")
    assert resp.status_code == 200
    data = resp.json()
    assert data["alive"] is True
    assert "status" in data


def test_system_start_stop_restart(client):
    resp = client.post("/v1/system/start")
    assert resp.status_code == 200
    assert resp.json()["status"] == "running"

    resp = client.post("/v1/system/stop")
    assert resp.status_code == 200
    assert resp.json()["status"] == "stopped"

    resp = client.post("/v1/system/restart")
    assert resp.status_code == 200
    assert resp.json()["status"] == "running"


def test_system_logs(client):
    # Trigger some log entries first
    client.get("/v1/system/heartbeat")
    resp = client.get("/v1/system/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert "entries" in data
    assert isinstance(data["entries"], list)


def test_system_logs_filter(client):
    # Generate some INFO log entries first
    client.get("/v1/system/heartbeat")
    client.post("/v1/system/start")
    resp = client.get("/v1/system/logs?level=INFO&limit=10")
    assert resp.status_code == 200
    data = resp.json()
    # At least one INFO entry should exist (from the heartbeat/start calls above)
    assert len(data["entries"]) > 0
    assert all(e["level"] == "INFO" for e in data["entries"])


def test_mission_lifecycle_start(client):
    resp = client.post(
        "/v1/missions/start",
        json={"goal": "Test mission", "category": "test"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "mission_id" in data
    assert data["state"] == "QUEUED"


def test_mission_lifecycle_start_persists_mode(client):
    resp = client.post(
        "/v1/missions/start",
        json={"goal": "Mode test mission", "category": "test", "mode": "combat"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "combat"

    status_resp = client.get(f"/v1/missions/status/{data['mission_id']}")
    assert status_resp.status_code == 200
    assert status_resp.json()["mode"] == "combat"


def test_mission_lifecycle_status(client):
    # Start a mission
    constraints = {"urgency": "high", "operator": "regan"}
    resp = client.post(
        "/v1/missions/start",
        json={
            "goal": "Status test mission",
            "category": "test",
            "constraints": constraints,
        },
    )
    mission_id = resp.json()["mission_id"]

    resp = client.get(f"/v1/missions/status/{mission_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["state"] == "QUEUED"
    assert data["mission_id"] == mission_id
    assert data["goal"] == "Status test mission"
    assert data["category"] == "test"
    assert data["constraints"] == constraints
    assert data["created_at"]
    assert data["execution_backed"] is False
    assert data["execution_truth_label"] == "LIFECYCLE STATE ONLY"
    assert data["execution_truth_detail"] == "Execution not yet wired."


def test_missions_list_status(client):
    resp = client.get("/v1/missions/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "missions" in data
    assert isinstance(data["missions"], list)
    if data["missions"]:
        mission = data["missions"][0]
        assert "execution_backed" in mission
        assert "execution_truth_label" in mission
        assert "execution_truth_detail" in mission


def test_mission_stop(client):
    resp = client.post(
        "/v1/missions/start",
        json={"goal": "Stop test", "category": "test"},
    )
    mission_id = resp.json()["mission_id"]

    resp = client.post("/v1/missions/stop", json={"mission_id": mission_id})
    assert resp.status_code == 200
    assert resp.json()["state"] == "ABORTED"


def test_mission_invalid_transition(client):
    resp = client.post(
        "/v1/missions/start",
        json={"goal": "Invalid transition test", "category": "test"},
    )
    mission_id = resp.json()["mission_id"]

    # Can't pause a QUEUED mission
    resp = client.post("/v1/missions/pause", json={"mission_id": mission_id})
    assert resp.status_code == 400


def test_mission_start_increments_operator_total_missions_once(tmp_path, monkeypatch):
    import swarmz_runtime.operator.memory as memory_mod

    operator_memory = OperatorMemory(path=tmp_path / "operator" / "memory.jsonl")
    monkeypatch.setattr(memory_mod, "_OPERATOR_MEMORY", operator_memory)

    with TestClient(app) as isolated_client:
        before = operator_memory.load().total_missions

        first_start = isolated_client.post(
            "/v1/missions/start",
            json={"goal": "Count mission one", "category": "test"},
        )
        assert first_start.status_code == 200
        after_first_start = operator_memory.load().total_missions

        mission_id = first_start.json()["mission_id"]
        status_resp = isolated_client.get(f"/v1/missions/status/{mission_id}")
        assert status_resp.status_code == 200
        after_status_poll = operator_memory.load().total_missions

        second_start = isolated_client.post(
            "/v1/missions/start",
            json={"goal": "Count mission two", "category": "test"},
        )
        assert second_start.status_code == 200
        after_second_start = operator_memory.load().total_missions

    assert before == 0
    assert after_first_start == 1
    assert after_status_poll == 1
    assert after_second_start == 2
