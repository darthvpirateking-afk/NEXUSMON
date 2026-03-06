from __future__ import annotations

import asyncio
from dataclasses import dataclass

import nexusmon_server
from fastapi.testclient import TestClient
from starlette.requests import Request

from nexusmon_server import app as nexusmon_app
from swarmz_runtime.api import server as runtime_server
from swarmz_runtime.api.server import app as runtime_app


@dataclass
class _StubCompanionResponse:
    reply: str = "characterized"
    mode: str = "strategic"
    tier_used: str = "STRATEGIC"
    tokens: int = 13
    latency_ms: float = 7.5

    def to_dict(self) -> dict[str, object]:
        return {
            "reply": self.reply,
            "mode": self.mode,
            "tier_used": self.tier_used,
            "tokens": self.tokens,
            "latency_ms": round(self.latency_ms, 2),
        }


def _assert_health_deep_shape(payload: dict[str, object]) -> None:
    assert "status" in payload
    assert payload["status"] in {"ok", "degraded"}
    assert "subsystems" in payload
    assert isinstance(payload["subsystems"], dict)
    for key in ("bridge", "governance", "orchestrator", "avatar"):
        assert key in payload["subsystems"]


def _assert_avatar_xp_shape(payload: dict[str, object]) -> None:
    assert set(("xp", "rank", "last_delta_source")).issubset(payload.keys())
    assert isinstance(payload["xp"], int)
    assert isinstance(payload["rank"], str)


def _assert_companion_shape(payload: dict[str, object]) -> None:
    assert set(("reply", "mode", "tier_used", "tokens", "latency_ms")).issubset(
        payload.keys()
    )
    assert isinstance(payload["reply"], str)
    assert isinstance(payload["mode"], str)
    assert isinstance(payload["tier_used"], str)
    assert isinstance(payload["tokens"], int)
    assert isinstance(payload["latency_ms"], (int, float))


def _make_request(path: str) -> Request:
    return Request({"type": "http", "method": "GET", "path": path, "headers": []})


async def _read_stream_contract(endpoint) -> dict[str, object]:
    response = await endpoint(_make_request("/api/audit/stream"))
    body_iterator = getattr(response, "body_iterator", None)
    assert body_iterator is not None

    first_chunk = await anext(body_iterator)
    close = getattr(body_iterator, "aclose", None)
    if close is not None:
        await close()

    if isinstance(first_chunk, bytes):
        first_chunk = first_chunk.decode("utf-8")

    return {
        "status_code": response.status_code,
        "media_type": response.media_type,
        "first_chunk": first_chunk,
    }


def _assert_stream_contract_shape(payload: dict[str, object]) -> None:
    assert payload["status_code"] == 200
    assert payload["media_type"] == "text/event-stream"
    assert isinstance(payload["first_chunk"], str)
    assert "keepalive" in payload["first_chunk"] or payload["first_chunk"].startswith(":")


def test_health_deep_shape_preserved_on_both_surfaces():
    with TestClient(nexusmon_app) as client_a:
        payload_a = client_a.get("/api/health/deep").json()
    with TestClient(runtime_app) as client_b:
        payload_b = client_b.get("/api/health/deep").json()

    _assert_health_deep_shape(payload_a)
    _assert_health_deep_shape(payload_b)


def test_avatar_xp_shape_preserved_on_both_surfaces():
    with TestClient(nexusmon_app) as client_a:
        payload_a = client_a.get("/api/avatar/xp").json()
    with TestClient(runtime_app) as client_b:
        payload_b = client_b.get("/api/avatar/xp").json()

    _assert_avatar_xp_shape(payload_a)
    _assert_avatar_xp_shape(payload_b)


def test_companion_nexusmon_shape_preserved_on_both_surfaces(monkeypatch):
    async def _stub_generate_response(prompt: str, mode: str = "strategic", context=None):
        return _StubCompanionResponse(reply=f"stub:{prompt}", mode=mode)

    monkeypatch.setattr(
        "swarmz_runtime.companion.voice.generate_response",
        _stub_generate_response,
    )

    with TestClient(nexusmon_app) as client_a:
        payload_a = client_a.post(
            "/v1/companion/nexusmon",
            json={"prompt": "characterize", "mode": "strategic"},
        ).json()

    with TestClient(runtime_app) as client_b:
        payload_b = client_b.post(
            "/v1/companion/nexusmon",
            json={"prompt": "characterize", "mode": "strategic"},
        ).json()

    _assert_companion_shape(payload_a)
    _assert_companion_shape(payload_b)
    assert payload_a["mode"] == "strategic"
    assert payload_b["mode"] == "strategic"


def test_audit_stream_contract_preserved_on_both_surfaces():
    response_a = asyncio.run(_read_stream_contract(nexusmon_server.api_audit_stream))
    response_b = asyncio.run(_read_stream_contract(runtime_server.api_audit_stream))

    _assert_stream_contract_shape(response_a)
    _assert_stream_contract_shape(response_b)