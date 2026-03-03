from fastapi.testclient import TestClient

from swarmz_server import app


def test_health_bridge_endpoint_extended_shape() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health/bridge")

    assert response.status_code == 200
    payload = response.json()

    assert "status" in payload
    assert "providers" in payload
    assert "circuit_breaker" in payload
    assert "budget" in payload
    assert "mode_table" in payload

    assert isinstance(payload["providers"], list)
    assert isinstance(payload["circuit_breaker"], dict)
    assert isinstance(payload["budget"], dict)
    assert isinstance(payload["mode_table"], dict)

    mode_table = payload["mode_table"]
    assert mode_table.get("strategic") == "cortex"
    assert mode_table.get("combat") == "reflex"
    assert mode_table.get("guardian") == "blocked"
