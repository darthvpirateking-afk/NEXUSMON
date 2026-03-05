from __future__ import annotations

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from swarmz_server import app


def test_existing_shape_preserved_with_additive_orchestrator():
    with TestClient(app) as client:
        response = client.post(
            "/api/missions",
            json={"type": "analysis", "payload": {"prompt": "compat mission"}},
        )
    assert response.status_code == 200
    payload = response.json()
    for key in ("mission_id", "status", "governance", "artifacts", "audit_refs"):
        assert key in payload
    assert "orchestrator" in payload


def test_existing_mission_routes_still_return_legacy_contract_keys():
    with TestClient(app) as client:
        dispatch = client.post(
            "/api/missions",
            json={"type": "analysis", "payload": {"prompt": "legacy keys"}},
        )
        mission_id = dispatch.json()["mission_id"]
        mission = client.get(f"/api/missions/{mission_id}")
        governance = client.get(f"/api/missions/{mission_id}/governance")
        artifacts = client.get(f"/api/missions/{mission_id}/artifacts")

    assert mission.status_code == 200
    assert governance.status_code == 200
    assert artifacts.status_code == 200
    assert set(("mission_id", "status", "governance", "mission")).issubset(
        set(mission.json().keys())
    )
    assert set(("mission_id", "governance", "events")).issubset(
        set(governance.json().keys())
    )
    assert set(("mission_id", "artifacts", "count")).issubset(
        set(artifacts.json().keys())
    )


def test_fallback_shape_is_valid_if_orchestrator_raises():
    with patch(
        "nexusmon_server.dispatch_mission_orchestrator",
        new_callable=AsyncMock,
    ) as orchestrator_dispatch:
        orchestrator_dispatch.side_effect = RuntimeError("orchestrator unavailable")
        with TestClient(app) as client:
            response = client.post(
                "/api/missions",
                json={"type": "analysis", "payload": {"prompt": "fallback path"}},
            )

    assert response.status_code == 200
    payload = response.json()
    for key in ("mission_id", "status", "governance", "artifacts", "audit_refs"):
        assert key in payload
