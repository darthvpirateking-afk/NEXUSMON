import pytest
from fastapi.testclient import TestClient


# -- Surface A: nexusmon_server ----------------------------------------------

@pytest.fixture(scope="module")
def nexusmon_client():
    from nexusmon_server import app

    return TestClient(app)


class TestNexusmonServerSurface:
    def test_endpoint_returns_200(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        assert r.status_code == 200

    def test_ok_is_true(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        assert r.json()["ok"] is True

    def test_timestamp_present(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        data = r.json()
        assert "timestamp" in data
        assert isinstance(data["timestamp"], str)
        assert len(data["timestamp"]) > 0

    def test_deployment_shape(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        dep = r.json()["deployment"]
        for key in [
            "platform",
            "public_url",
            "has_render_yaml",
            "has_railway_json",
            "is_cloud_hint",
        ]:
            assert key in dep, f"deployment missing key: {key}"

    def test_mobile_shape(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        mob = r.json()["mobile"]
        for key in [
            "mobile_access",
            "has_capacitor_wrapper",
            "has_capacitor_config",
            "recommended_manifest",
            "recommended_start",
        ]:
            assert key in mob, f"mobile missing key: {key}"

    def test_recommended_manifest_path(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        assert r.json()["mobile"]["recommended_manifest"].endswith("/pwa/manifest.json")

    def test_recommended_start_path(self, nexusmon_client):
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        assert r.json()["mobile"]["recommended_start"].endswith("/console")

    def test_platform_not_asserted(self, nexusmon_client):
        # Platform is env/filesystem dependent - just assert it's a string.
        r = nexusmon_client.get("/v1/deployment/mobile-status")
        assert isinstance(r.json()["deployment"]["platform"], str)


# -- Surface B: swarmz_runtime.api.server ------------------------------------

@pytest.fixture(scope="module")
def runtime_client():
    from swarmz_runtime.api.server import app

    return TestClient(app)


class TestRuntimeServerSurface:
    def test_endpoint_returns_200(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        assert r.status_code == 200

    def test_ok_is_true(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        assert r.json()["ok"] is True

    def test_timestamp_present(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        data = r.json()
        assert "timestamp" in data
        assert isinstance(data["timestamp"], str)

    def test_deployment_shape(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        dep = r.json()["deployment"]
        for key in [
            "platform",
            "public_url",
            "has_render_yaml",
            "has_railway_json",
            "is_cloud_hint",
        ]:
            assert key in dep, f"deployment missing key: {key}"

    def test_mobile_shape(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        mob = r.json()["mobile"]
        for key in [
            "mobile_access",
            "has_capacitor_wrapper",
            "has_capacitor_config",
            "recommended_manifest",
            "recommended_start",
        ]:
            assert key in mob, f"mobile missing key: {key}"

    def test_recommended_manifest_path(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        assert r.json()["mobile"]["recommended_manifest"].endswith("/pwa/manifest.json")

    def test_recommended_start_path(self, runtime_client):
        r = runtime_client.get("/v1/deployment/mobile-status")
        assert r.json()["mobile"]["recommended_start"].endswith("/console")

    def test_both_surfaces_agree(self, nexusmon_client, runtime_client):
        """Both surfaces must return identical payload shape."""
        r1 = nexusmon_client.get("/v1/deployment/mobile-status").json()
        r2 = runtime_client.get("/v1/deployment/mobile-status").json()
        assert r1["ok"] == r2["ok"]
        assert set(r1["deployment"].keys()) == set(r2["deployment"].keys())
        assert set(r1["mobile"].keys()) == set(r2["mobile"].keys())
