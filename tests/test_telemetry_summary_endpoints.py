import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def nexusmon_client():
    from nexusmon_server import app

    return TestClient(app)


@pytest.fixture(scope="module")
def runtime_client():
    from swarmz_runtime.api.server import app

    return TestClient(app)


def _assert_summary_shape(payload: dict):
    assert payload["ok"] is True
    assert payload["status"] in {"ok", "degraded"}
    assert isinstance(payload["timestamp"], str)
    assert isinstance(payload["degraded_feeds"], list)
    assert set(payload.keys()) >= {
        "ok",
        "timestamp",
        "status",
        "degraded_feeds",
        "health",
        "bridge",
        "missions",
        "evolution",
        "bond",
    }


class TestTelemetrySummaryEndpoint:
    def test_nexusmon_surface(self, nexusmon_client):
        response = nexusmon_client.get("/v1/telemetry/summary")
        assert response.status_code == 200
        _assert_summary_shape(response.json())

    def test_runtime_surface(self, runtime_client):
        response = runtime_client.get("/v1/telemetry/summary")
        assert response.status_code == 200
        _assert_summary_shape(response.json())

    def test_both_surfaces_expose_same_shape(self, nexusmon_client, runtime_client):
        payload_a = nexusmon_client.get("/v1/telemetry/summary").json()
        payload_b = runtime_client.get("/v1/telemetry/summary").json()

        assert set(payload_a.keys()) == set(payload_b.keys())
        assert set(payload_a["health"].keys()) == set(payload_b["health"].keys())
        assert set(payload_a["bridge"].keys()) == set(payload_b["bridge"].keys())
        assert set(payload_a["missions"].keys()) == set(payload_b["missions"].keys())
        assert set(payload_a["evolution"].keys()) == set(payload_b["evolution"].keys())
        assert set(payload_a["bond"].keys()) == set(payload_b["bond"].keys())