"""Tests for FederationCouncil — register, deregister, list, coordinate."""
from __future__ import annotations

import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from swarmz_runtime.federation.council import (
    AgentAlreadyRegistered,
    AgentNotFound,
    AgentRegistration,
    AgentResult,
    CoordinationResult,
    FederationCouncil,
    get_council,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _run(coro):
    return asyncio.run(coro)


def _bridge_response(content: str = "done", tokens: int = 20):
    from swarmz_runtime.bridge.llm import BridgeResponse
    return BridgeResponse(
        content=content,
        model_used="openai/gpt-4o",
        provider="openai",
        tokens_used=tokens,
        tier=1,
        latency_ms=50.0,
    )


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def council(tmp_path, monkeypatch):
    """Fresh FederationCouncil with artifacts redirected to tmp_path."""
    import swarmz_runtime.federation.council as mod
    monkeypatch.setattr(mod, "_ARTIFACTS_DIR", tmp_path / "federation")
    monkeypatch.setattr(mod, "_REGISTRY_FILE", tmp_path / "federation" / "registry.jsonl")
    return FederationCouncil()


# ── AgentRegistration model ───────────────────────────────────────────────────


class TestAgentRegistrationModel:
    def test_to_dict_keys(self, council):
        reg = council.register("alpha", mode="strategic")
        d = reg.to_dict()
        assert set(d.keys()) == {"agent_id", "mode", "registered_at"}

    def test_to_dict_values(self, council):
        reg = council.register("beta", mode="combat")
        d = reg.to_dict()
        assert d["agent_id"] == "beta"
        assert d["mode"] == "combat"
        assert d["registered_at"]


# ── AgentResult model ─────────────────────────────────────────────────────────


class TestAgentResultModel:
    def test_to_dict_complete(self):
        r = AgentResult(
            agent_id="x",
            mode="strategic",
            status="complete",
            output="hello",
            error=None,
            tokens=10,
            latency_ms=100.0,
        )
        d = r.to_dict()
        assert d["status"] == "complete"
        assert d["output"] == "hello"
        assert d["error"] is None
        assert d["tokens"] == 10

    def test_to_dict_error(self):
        r = AgentResult(
            agent_id="y",
            mode="combat",
            status="error",
            output=None,
            error="provider down",
            tokens=0,
            latency_ms=5.0,
        )
        d = r.to_dict()
        assert d["status"] == "error"
        assert d["error"] == "provider down"

    def test_latency_ms_rounded(self):
        r = AgentResult("a", "strategic", "complete", "x", None, 1, latency_ms=123.456789)
        assert r.to_dict()["latency_ms"] == 123.46


# ── CoordinationResult model ──────────────────────────────────────────────────


class TestCoordinationResultModel:
    def test_to_dict_keys(self):
        cr = CoordinationResult(
            federation_id="abc123",
            goal="test goal",
            agent_results=[],
            created_at="2026-01-01T00:00:00+00:00",
            completed_at="2026-01-01T00:00:01+00:00",
        )
        d = cr.to_dict()
        assert "federation_id" in d
        assert "goal" in d
        assert "agent_results" in d
        assert "created_at" in d
        assert "completed_at" in d


# ── Register ──────────────────────────────────────────────────────────────────


class TestRegister:
    def test_register_returns_registration(self, council):
        reg = council.register("agent-1", mode="strategic")
        assert isinstance(reg, AgentRegistration)
        assert reg.agent_id == "agent-1"
        assert reg.mode == "strategic"

    def test_register_default_mode_is_strategic(self, council):
        reg = council.register("agent-x")
        assert reg.mode == "strategic"

    def test_register_duplicate_raises(self, council):
        council.register("dup-agent")
        with pytest.raises(AgentAlreadyRegistered, match="dup-agent"):
            council.register("dup-agent")

    def test_register_empty_agent_id_raises(self, council):
        with pytest.raises(ValueError):
            council.register("")

    def test_register_whitespace_agent_id_raises(self, council):
        with pytest.raises(ValueError):
            council.register("   ")

    def test_register_strips_whitespace(self, council):
        reg = council.register("  alpha  ", mode="  combat  ")
        assert reg.agent_id == "alpha"
        assert reg.mode == "combat"

    def test_register_multiple_agents(self, council):
        council.register("a1")
        council.register("a2")
        council.register("a3")
        assert len(council.list_agents()) == 3

    def test_register_persists_to_disk(self, council, tmp_path):
        import swarmz_runtime.federation.council as mod
        council.register("persist-me", mode="combat")
        registry_file = tmp_path / "federation" / "registry.jsonl"
        assert registry_file.exists()
        content = registry_file.read_text()
        assert "persist-me" in content


# ── Deregister ────────────────────────────────────────────────────────────────


class TestDeregister:
    def test_deregister_removes_agent(self, council):
        council.register("to-remove")
        council.deregister("to-remove")
        assert all(a.agent_id != "to-remove" for a in council.list_agents())

    def test_deregister_unknown_raises(self, council):
        with pytest.raises(AgentNotFound, match="ghost"):
            council.deregister("ghost")

    def test_deregister_allows_reregister(self, council):
        council.register("cycling")
        council.deregister("cycling")
        reg = council.register("cycling", mode="combat")
        assert reg.mode == "combat"


# ── List agents ───────────────────────────────────────────────────────────────


class TestListAgents:
    def test_empty_registry(self, council):
        assert council.list_agents() == []

    def test_list_returns_all(self, council):
        council.register("a1", "strategic")
        council.register("a2", "combat")
        ids = {a.agent_id for a in council.list_agents()}
        assert ids == {"a1", "a2"}

    def test_list_is_snapshot(self, council):
        council.register("snap")
        snapshot = council.list_agents()
        council.register("later")
        # snapshot should not include "later"
        assert len(snapshot) == 1


# ── Coordinate ────────────────────────────────────────────────────────────────


class TestCoordinateHappyPath:
    def test_coordinate_returns_coordination_result(self, council):
        council.register("agent-A", mode="strategic")
        council.register("agent-B", mode="combat")

        mock_dispatch = AsyncMock(
            return_value=AgentResult("x", "strategic", "complete", "done", None, 10, 5.0)
        )
        with patch.object(council, "_dispatch_agent", mock_dispatch):
            result = _run(council.coordinate(goal="test goal", budget_tokens=100))

        assert isinstance(result, CoordinationResult)
        assert result.goal == "test goal"
        assert len(result.agent_results) == 2
        assert mock_dispatch.call_count == 2

    def test_coordinate_empty_registry(self, council):
        result = _run(council.coordinate(goal="lonely goal"))
        assert result.agent_results == []
        assert result.goal == "lonely goal"

    def test_federation_id_is_12_hex_chars(self, council):
        result = _run(council.coordinate(goal="x"))
        assert len(result.federation_id) == 12
        assert all(c in "0123456789abcdef" for c in result.federation_id)

    def test_coordinate_persists_to_disk(self, council, tmp_path):
        import swarmz_runtime.federation.council as mod
        mock_dispatch = AsyncMock(
            return_value=AgentResult("a1", "strategic", "complete", "x", None, 5, 1.0)
        )
        council.register("a1")
        with patch.object(council, "_dispatch_agent", mock_dispatch):
            result = _run(council.coordinate(goal="persist test"))

        coord_file = tmp_path / "federation" / f"{result.federation_id}.jsonl"
        assert coord_file.exists()
        content = coord_file.read_text()
        assert "coordination_start" in content
        assert "coordination_complete" in content


class TestCoordinateErrorPaths:
    def test_agent_error_does_not_raise(self, council):
        council.register("failing-agent")
        mock_dispatch = AsyncMock(
            return_value=AgentResult("failing-agent", "strategic", "error", None, "boom", 0, 1.0)
        )
        with patch.object(council, "_dispatch_agent", mock_dispatch):
            result = _run(council.coordinate(goal="bad goal"))

        assert result.agent_results[0].status == "error"
        assert result.agent_results[0].error == "boom"

    def test_mixed_results_collected(self, council):
        council.register("ok-agent")
        council.register("err-agent")

        async def _mixed(reg, goal, budget_tokens):
            if reg.agent_id == "ok-agent":
                return AgentResult("ok-agent", "strategic", "complete", "ok", None, 10, 1.0)
            return AgentResult("err-agent", "combat", "error", None, "fail", 0, 1.0)

        with patch.object(council, "_dispatch_agent", _mixed):
            result = _run(council.coordinate(goal="mixed"))

        statuses = {r.agent_id: r.status for r in result.agent_results}
        assert statuses["ok-agent"] == "complete"
        assert statuses["err-agent"] == "error"


# ── Dispatch agent internals ──────────────────────────────────────────────────


class TestDispatchAgent:
    def test_dispatch_success(self, council):
        reg = AgentRegistration("d-agent", "strategic", "2026-01-01T00:00:00+00:00")
        mock_bridge = AsyncMock(return_value=_bridge_response("result", tokens=42))
        with patch("swarmz_runtime.bridge.llm.call_v2", mock_bridge):
            result = _run(council._dispatch_agent(reg, "dispatch goal", 200))

        assert result.status == "complete"
        assert result.output == "result"
        assert result.tokens == 42
        assert result.agent_id == "d-agent"

    def test_dispatch_exception_returns_error_result(self, council):
        reg = AgentRegistration("fail-agent", "strategic", "2026-01-01T00:00:00+00:00")
        mock_bridge = AsyncMock(side_effect=RuntimeError("bridge exploded"))
        with patch("swarmz_runtime.bridge.llm.call_v2", mock_bridge):
            result = _run(council._dispatch_agent(reg, "fail goal", 200))

        assert result.status == "error"
        assert "bridge exploded" in result.error
        assert result.output is None
        assert result.tokens == 0


# ── XP award after coordination ───────────────────────────────────────────────


class TestXPAwardOnCoordinate:
    def test_xp_awarded_for_successful_agents(self, council):
        council.register("xp-agent")
        mock_dispatch = AsyncMock(
            return_value=AgentResult("xp-agent", "strategic", "complete", "ok", None, 200, 1.0)
        )
        mock_award = MagicMock()
        with patch.object(council, "_dispatch_agent", mock_dispatch), \
             patch("swarmz_runtime.evolution.engine.award_xp", mock_award):
            _run(council.coordinate(goal="xp goal"))

        assert mock_award.called
        call_args = mock_award.call_args
        assert call_args[0][0] == "xp-agent"  # agent_id
        assert "federation:" in call_args[0][2]  # source

    def test_xp_not_awarded_for_failed_agents(self, council):
        council.register("fail-xp")
        mock_dispatch = AsyncMock(
            return_value=AgentResult("fail-xp", "strategic", "error", None, "err", 0, 1.0)
        )
        mock_award = MagicMock()
        with patch.object(council, "_dispatch_agent", mock_dispatch), \
             patch("swarmz_runtime.evolution.engine.award_xp", mock_award):
            _run(council.coordinate(goal="fail goal"))

        assert not mock_award.called


# ── get_council singleton ─────────────────────────────────────────────────────


class TestGetCouncilSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.federation.council as mod
        monkeypatch.setattr(mod, "_COUNCIL", None)
        c1 = get_council()
        c2 = get_council()
        assert c1 is c2
        monkeypatch.setattr(mod, "_COUNCIL", None)

    def test_returns_federation_council_instance(self, monkeypatch):
        import swarmz_runtime.federation.council as mod
        monkeypatch.setattr(mod, "_COUNCIL", None)
        c = get_council()
        assert isinstance(c, FederationCouncil)
        monkeypatch.setattr(mod, "_COUNCIL", None)


