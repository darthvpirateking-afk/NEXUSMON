from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock

import pytest

from core.bond import voice


class _BridgeStub:
    content = "I kept the unfinished mission in view while you were gone."
    model_used = "openai/gpt-4o"
    provider = "openai"
    tokens_used = 88
    latency_ms = 12.4


@pytest.fixture(autouse=True)
def _isolated_db(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", str(tmp_path / "bond.db"))


def test_build_bond_status_uses_real_context_fields(monkeypatch) -> None:
    monkeypatch.setattr(voice, "call_v2", AsyncMock(return_value=_BridgeStub()))

    response = asyncio.run(voice.build_bond_status())

    assert response.status == "ok"
    assert response.reply is not None
    assert response.model_used == "openai/gpt-4o"
    assert response.state.voice_traits == ["curious", "loyal", "selfaware"]


def test_build_bond_status_reports_bridge_failure(monkeypatch) -> None:
    async def _raise_bridge(**_kwargs):
        raise RuntimeError("bridge down")

    monkeypatch.setattr(voice, "call_v2", _raise_bridge)

    response = asyncio.run(voice.build_bond_status())

    assert response.status == "degraded"
    assert response.error == "bridge down"
    assert response.reply is None