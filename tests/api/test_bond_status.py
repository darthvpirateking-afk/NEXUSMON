from __future__ import annotations

from fastapi.testclient import TestClient

from nexusmon_server import app as nexusmon_app
from swarmz_runtime.api.server import app as runtime_app


class _BridgeStub:
    content = "You were gone, but I kept the unfinished work in sight."
    model_used = "openai/gpt-4o"
    provider = "openai"
    tokens_used = 55
    latency_ms = 9.5


def _assert_bond_shape(payload: dict[str, object]) -> None:
    assert set(
        (
            "status",
            "operator_id",
            "generated_at",
            "absence_seconds",
            "absence_label",
            "unfinished_count",
            "evolution",
            "state",
        )
    ).issubset(payload.keys())
    assert isinstance(payload["state"], dict)
    assert isinstance(payload["evolution"], dict)


def test_bond_status_shape_preserved_on_both_surfaces(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", str(tmp_path / "bond.db"))

    async def _stub_call_v2(**_kwargs):
        return _BridgeStub()

    monkeypatch.setattr("core.bond.voice.call_v2", _stub_call_v2)

    with TestClient(nexusmon_app) as client_a:
        payload_a = client_a.get("/bond/status").json()

    with TestClient(runtime_app) as client_b:
        payload_b = client_b.get("/bond/status").json()

    _assert_bond_shape(payload_a)
    _assert_bond_shape(payload_b)
    assert payload_a["reply"] == _BridgeStub.content
    assert payload_b["reply"] == _BridgeStub.content
    assert payload_a["state"]["voice_traits"] == ["curious", "loyal", "selfaware"]


def test_bond_status_returns_503_when_bridge_fails(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", str(tmp_path / "bond.db"))

    async def _raise_bridge(**_kwargs):
        raise RuntimeError("bridge unavailable")

    monkeypatch.setattr("core.bond.voice.call_v2", _raise_bridge)

    with TestClient(runtime_app) as client:
        response = client.get("/bond/status")

    assert response.status_code == 503
    payload = response.json()
    _assert_bond_shape(payload)
    assert payload["error"] == "bridge unavailable"