"""Tests for swarmz_runtime.swarm.coordinator — spawn, track, persist."""
from __future__ import annotations

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from swarmz_runtime.swarm.coordinator import (
    AgentState,
    SpawnRequest,
    SwarmCoordinator,
    SwarmState,
)


def _run(coro):
    return asyncio.run(coro)


def _bridge_resp(**kwargs):
    from swarmz_runtime.bridge.llm import BridgeResponse
    defaults = dict(
        content="Bridge output",
        model_used="test/model",
        provider="test",
        tokens_used=100,
        tier=1,
        latency_ms=10.0,
    )
    defaults.update(kwargs)
    return BridgeResponse(**defaults)


# ---------------------------------------------------------------------------
# Fixture: isolated coordinator with tmp artifacts dir
# ---------------------------------------------------------------------------


@pytest.fixture
def coord(tmp_path, monkeypatch):
    import swarmz_runtime.swarm.coordinator as mod
    monkeypatch.setattr(mod, "_ARTIFACTS_DIR", tmp_path / "swarm")
    monkeypatch.setattr(mod, "_COORDINATOR", None)
    return SwarmCoordinator()


# ---------------------------------------------------------------------------
# SpawnRequest
# ---------------------------------------------------------------------------


class TestSpawnRequest:
    def test_defaults(self):
        req = SpawnRequest(agent_id="a1", goal="do something")
        assert req.mode == "strategic"
        assert req.constraints == {}

    def test_custom_mode(self):
        req = SpawnRequest(agent_id="a1", goal="strike fast", mode="combat")
        assert req.mode == "combat"

    def test_custom_constraints(self):
        req = SpawnRequest(agent_id="a1", goal="g", constraints={"max_tokens": 512})
        assert req.constraints["max_tokens"] == 512


# ---------------------------------------------------------------------------
# AgentState serialization
# ---------------------------------------------------------------------------


class TestAgentStateToDict:
    def test_all_keys_present(self):
        agent = AgentState(
            agent_id="a1", swarm_id="s1", goal="g", mode="strategic",
            status="complete", output="out", error=None, tokens=100,
            latency_ms=50.0, spawned_at="2026-01-01T00:00:00", completed_at="2026-01-01T00:01:00",
        )
        d = agent.to_dict()
        for key in (
            "agent_id", "swarm_id", "goal", "mode", "status",
            "output", "error", "tokens", "latency_ms", "spawned_at", "completed_at",
        ):
            assert key in d, f"Missing key: {key}"

    def test_latency_ms_rounded(self):
        agent = AgentState(
            agent_id="a1", swarm_id="s1", goal="g", mode="strategic",
            status="complete", output=None, error=None, tokens=0,
            latency_ms=123.456789, spawned_at="t", completed_at=None,
        )
        assert agent.to_dict()["latency_ms"] == 123.46


# ---------------------------------------------------------------------------
# SwarmState serialization
# ---------------------------------------------------------------------------


class TestSwarmStateToDict:
    def test_shape(self):
        agent = AgentState(
            agent_id="a1", swarm_id="s1", goal="g", mode="strategic",
            status="complete", output="out", error=None, tokens=10,
            latency_ms=5.0, spawned_at="t", completed_at="t2",
        )
        swarm = SwarmState(swarm_id="s1", agents=[agent], created_at="t")
        d = swarm.to_dict()
        assert d["swarm_id"] == "s1"
        assert len(d["agents"]) == 1
        assert "created_at" in d

    def test_nested_agents_serialized(self):
        agent = AgentState(
            agent_id="a99", swarm_id="s1", goal="g", mode="combat",
            status="error", output=None, error="fail", tokens=0,
            latency_ms=0.0, spawned_at="t", completed_at="t2",
        )
        swarm = SwarmState(swarm_id="s1", agents=[agent], created_at="t")
        d = swarm.to_dict()
        assert d["agents"][0]["agent_id"] == "a99"
        assert d["agents"][0]["status"] == "error"


# ---------------------------------------------------------------------------
# SwarmCoordinator.spawn — happy path
# ---------------------------------------------------------------------------


class TestSpawnHappyPath:
    def test_returns_swarm_id_and_agent(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="analyze")))

        assert isinstance(swarm_id, str)
        assert len(swarm_id) == 12
        assert isinstance(agent, AgentState)

    def test_agent_status_complete(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.status == "complete"

    def test_agent_output_captured(self, coord):
        resp = _bridge_resp(content="Mission analyzed.")
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.output == "Mission analyzed."

    def test_agent_tokens_recorded(self, coord):
        resp = _bridge_resp(tokens_used=350)
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.tokens == 350

    def test_completed_at_set(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.completed_at is not None

    def test_agent_id_and_mode_preserved(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="agent-alpha", goal="g", mode="combat")))

        assert agent.agent_id == "agent-alpha"
        assert agent.mode == "combat"

    def test_constraints_max_tokens_forwarded_to_bridge(self, coord):
        mock_call = AsyncMock(return_value=_bridge_resp())
        with patch("swarmz_runtime.bridge.llm.call_v2", new=mock_call), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _run(coord.spawn(SpawnRequest(agent_id="nx", goal="g", constraints={"max_tokens": 512})))

        assert mock_call.call_args.kwargs["budget_tokens"] == 512

    def test_default_budget_is_2048(self, coord):
        mock_call = AsyncMock(return_value=_bridge_resp())
        with patch("swarmz_runtime.bridge.llm.call_v2", new=mock_call), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            _run(coord.spawn(SpawnRequest(agent_id="nx", goal="g")))

        assert mock_call.call_args.kwargs["budget_tokens"] == 2048


# ---------------------------------------------------------------------------
# SwarmCoordinator.spawn — error paths
# ---------------------------------------------------------------------------


class TestSpawnErrorPaths:
    def test_bridge_error_sets_error_status(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("bridge down"))):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.status == "error"
        assert "bridge down" in agent.error

    def test_bridge_error_output_is_none(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("fail"))):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.output is None

    def test_guardian_mode_blocked(self, coord):
        from swarmz_runtime.bridge.mode import GuardianCallBlocked
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=GuardianCallBlocked("blocked"))):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="observe", mode="guardian")))

        assert agent.status == "error"
        assert agent.error is not None

    def test_error_still_sets_completed_at(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("x"))):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="goal")))

        assert agent.completed_at is not None


# ---------------------------------------------------------------------------
# XP award
# ---------------------------------------------------------------------------


class TestXPAward:
    def test_xp_awarded_on_success(self, coord):
        mock_xp = MagicMock()
        resp = _bridge_resp(tokens_used=500)
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)), \
             patch("swarmz_runtime.evolution.engine.award_xp", mock_xp):
            _, agent = _run(coord.spawn(SpawnRequest(agent_id="nexusmon", goal="g")))

        mock_xp.assert_called_once()
        call_args = mock_xp.call_args[0]
        assert call_args[0] == "nexusmon"     # agent_id
        assert call_args[1] >= 1              # xp >= 1

    def test_xp_source_references_swarm_id(self, coord):
        mock_xp = MagicMock()
        resp = _bridge_resp(tokens_used=200)
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)), \
             patch("swarmz_runtime.evolution.engine.award_xp", mock_xp):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="nx", goal="g")))

        source = mock_xp.call_args[0][2]
        assert swarm_id in source

    def test_xp_not_awarded_on_error(self, coord):
        mock_xp = MagicMock()
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("fail"))), \
             patch("swarmz_runtime.evolution.engine.award_xp", mock_xp):
            _run(coord.spawn(SpawnRequest(agent_id="nx", goal="g")))

        mock_xp.assert_not_called()

    def test_xp_amount_scales_with_tokens(self, coord):
        mock_xp = MagicMock()
        resp = _bridge_resp(tokens_used=1000)
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)), \
             patch("swarmz_runtime.evolution.engine.award_xp", mock_xp):
            _run(coord.spawn(SpawnRequest(agent_id="nx", goal="g")))

        xp = mock_xp.call_args[0][1]
        assert xp == 10   # 1000 // 100


# ---------------------------------------------------------------------------
# SwarmCoordinator.track
# ---------------------------------------------------------------------------


class TestTrack:
    def test_track_returns_swarm_after_spawn(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="a1", goal="goal")))

        state = coord.track(swarm_id)
        assert state is not None
        assert state.swarm_id == swarm_id

    def test_track_agents_populated(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="a1", goal="goal")))

        state = coord.track(swarm_id)
        assert len(state.agents) == 1
        assert state.agents[0].agent_id == "a1"

    def test_track_unknown_returns_none(self, coord):
        result = coord.track("nonexistent-swarm-xyz")
        assert result is None

    def test_track_loads_from_disk_after_memory_cleared(self, coord):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="disk-agent", goal="g")))

        with coord._lock:
            del coord._swarms[swarm_id]

        state = coord.track(swarm_id)
        assert state is not None
        assert state.swarm_id == swarm_id


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


class TestPersistence:
    def test_jsonl_file_created(self, coord, tmp_path, monkeypatch):
        import swarmz_runtime.swarm.coordinator as mod
        artifacts_dir = tmp_path / "swarm"
        monkeypatch.setattr(mod, "_ARTIFACTS_DIR", artifacts_dir)

        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="a1", goal="g")))

        assert (artifacts_dir / f"{swarm_id}.jsonl").exists()

    def test_jsonl_has_spawn_and_snapshot_events(self, coord, tmp_path, monkeypatch):
        import swarmz_runtime.swarm.coordinator as mod
        artifacts_dir = tmp_path / "swarm"
        monkeypatch.setattr(mod, "_ARTIFACTS_DIR", artifacts_dir)

        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="a1", goal="g")))

        lines = [
            json.loads(l)
            for l in (artifacts_dir / f"{swarm_id}.jsonl").read_text().splitlines()
            if l.strip()
        ]
        types = [l["_type"] for l in lines]
        assert "spawn" in types
        assert "snapshot" in types

    def test_snapshot_contains_correct_output(self, coord, tmp_path, monkeypatch):
        import swarmz_runtime.swarm.coordinator as mod
        artifacts_dir = tmp_path / "swarm"
        monkeypatch.setattr(mod, "_ARTIFACTS_DIR", artifacts_dir)

        resp = _bridge_resp(content="persisted output")
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)), \
             patch("swarmz_runtime.evolution.engine.award_xp"):
            swarm_id, _ = _run(coord.spawn(SpawnRequest(agent_id="a1", goal="g")))

        lines = [
            json.loads(l)
            for l in (artifacts_dir / f"{swarm_id}.jsonl").read_text().splitlines()
            if l.strip()
        ]
        snapshot = next(l for l in lines if l["_type"] == "snapshot")
        assert snapshot["agents"][0]["output"] == "persisted output"
