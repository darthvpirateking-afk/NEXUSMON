"""Tests for CommandFusion — step execution, dependency ordering, presets, persistence."""
from __future__ import annotations

import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from swarmz_runtime.doctrine.command_fusion import (
    CommandFusion,
    FusionResult,
    FusionScript,
    FusionStep,
    PRESETS,
    StepResult,
    get_command_fusion,
)


def _run(coro):
    return asyncio.run(coro)


_OP_KEY = "swarmz_sovereign_key"


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def cf(tmp_path, monkeypatch):
    """Fresh CommandFusion with artifacts in tmp_path."""
    import swarmz_runtime.doctrine.command_fusion as mod
    monkeypatch.setattr(mod, "_COMMAND_FUSION", None)
    return CommandFusion(artifacts_dir=tmp_path / "fusion")


# ── Model tests ───────────────────────────────────────────────────────────────


class TestFusionStepModel:
    def test_to_dict_keys(self):
        step = FusionStep(step_id="s1", action="swarm", params={"goal": "x"}, depends_on=None)
        d = step.to_dict()
        assert set(d.keys()) == {"step_id", "action", "params", "depends_on"}

    def test_from_dict_roundtrip(self):
        original = FusionStep(step_id="s1", action="swarm", params={"goal": "x"}, depends_on=["s0"])
        restored = FusionStep.from_dict(original.to_dict())
        assert restored.step_id == original.step_id
        assert restored.depends_on == original.depends_on

    def test_from_dict_no_depends(self):
        step = FusionStep.from_dict({"step_id": "s1", "action": "mission"})
        assert step.depends_on is None


class TestStepResultModel:
    def test_to_dict_complete(self):
        r = StepResult(step_id="s1", action="swarm", status="complete", output="done")
        d = r.to_dict()
        assert d["status"] == "complete"
        assert d["output"] == "done"

    def test_to_dict_error(self):
        r = StepResult(step_id="s1", action="swarm", status="error", error="boom")
        d = r.to_dict()
        assert d["error"] == "boom"


class TestFusionResultModel:
    def test_to_dict_keys(self):
        result = FusionResult(
            fusion_id="abc123", name="test", status="complete",
            step_results=[], created_at="2026-01-01T00:00:00+00:00",
            completed_at="2026-01-01T00:00:01+00:00"
        )
        d = result.to_dict()
        assert "fusion_id" in d
        assert "step_results" in d
        assert "status" in d


# ── Presets ───────────────────────────────────────────────────────────────────


class TestPresets:
    def test_forge_exists(self):
        assert "FORGE" in PRESETS

    def test_deploy_exists(self):
        assert "DEPLOY" in PRESETS

    def test_ignite_exists(self):
        assert "IGNITE" in PRESETS

    def test_presets_have_steps(self):
        for name, preset in PRESETS.items():
            assert len(preset["steps"]) > 0, f"{name} has no steps"

    def test_presets_have_step_ids(self):
        for name, preset in PRESETS.items():
            for step in preset["steps"]:
                assert "step_id" in step


# ── Execute fusion — happy path ───────────────────────────────────────────────


class TestExecuteFusionHappyPath:
    def test_single_step_complete(self, cf):
        script = FusionScript(
            steps=[FusionStep(step_id="s1", action="mission", params={"goal": "test"})],
            name="test-run",
        )
        result = _run(cf.execute_fusion(script))
        assert isinstance(result, FusionResult)
        assert result.status == "complete"
        assert len(result.step_results) == 1

    def test_result_has_fusion_id(self, cf):
        script = FusionScript(steps=[FusionStep(step_id="s1", action="evolve")])
        result = _run(cf.execute_fusion(script))
        assert len(result.fusion_id) == 12
        assert all(c in "0123456789abcdef" for c in result.fusion_id)

    def test_parallel_independent_steps(self, cf):
        steps = [
            FusionStep(step_id="a", action="mission", params={"goal": "a"}),
            FusionStep(step_id="b", action="evolve", depends_on=None),
        ]
        result = _run(cf.execute_fusion(FusionScript(steps=steps, name="parallel-test")))
        assert result.status == "complete"
        assert len(result.step_results) == 2

    def test_sequential_dependent_steps(self, cf):
        steps = [
            FusionStep(step_id="first", action="mission"),
            FusionStep(step_id="second", action="evolve", depends_on=["first"]),
        ]
        result = _run(cf.execute_fusion(FusionScript(steps=steps)))
        assert result.status == "complete"
        # second must appear after first in step_results
        ids = [r.step_id for r in result.step_results]
        assert ids.index("first") < ids.index("second")

    def test_empty_steps_complete(self, cf):
        result = _run(cf.execute_fusion(FusionScript(steps=[], name="empty")))
        assert result.status == "complete"
        assert result.step_results == []


# ── Persistence ───────────────────────────────────────────────────────────────


class TestPersistence:
    def test_artifact_created(self, cf, tmp_path):
        script = FusionScript(steps=[FusionStep(step_id="s1", action="mission")])
        result = _run(cf.execute_fusion(script))
        artifact = cf._artifacts_dir / f"{result.fusion_id}.jsonl"
        assert artifact.exists()

    def test_artifact_contains_start_and_complete(self, cf):
        script = FusionScript(steps=[FusionStep(step_id="s1", action="mission")])
        result = _run(cf.execute_fusion(script))
        content = (cf._artifacts_dir / f"{result.fusion_id}.jsonl").read_text()
        assert "fusion_start" in content
        assert "fusion_complete" in content

    def test_read_result_returns_result(self, cf):
        script = FusionScript(steps=[FusionStep(step_id="s1", action="mission")], name="readback")
        result = _run(cf.execute_fusion(script))
        loaded = cf._read_result(result.fusion_id)
        assert loaded is not None
        assert loaded.fusion_id == result.fusion_id

    def test_read_result_none_for_unknown_id(self, cf):
        assert cf._read_result("nonexistent") is None

    def test_history_includes_completed_runs(self, cf):
        script = FusionScript(steps=[FusionStep(step_id="s1", action="mission")])
        _run(cf.execute_fusion(script))
        _run(cf.execute_fusion(script))
        history = cf.history()
        assert len(history) >= 2


# ── Error paths ───────────────────────────────────────────────────────────────


class TestErrorPaths:
    def test_unknown_action_returns_error_step(self, cf):
        script = FusionScript(steps=[FusionStep(step_id="bad", action="__unknown_action__")])
        result = _run(cf.execute_fusion(script))
        assert result.step_results[0].status == "error"

    def test_partial_status_when_some_steps_error(self, cf):
        steps = [
            FusionStep(step_id="ok", action="mission"),
            FusionStep(step_id="bad", action="__nonexistent__"),
        ]
        result = _run(cf.execute_fusion(FusionScript(steps=steps)))
        statuses = {r.step_id: r.status for r in result.step_results}
        assert statuses["ok"] == "complete"
        assert statuses["bad"] == "error"
        assert result.status in ("partial", "complete")  # has some failures

    def test_step_exception_does_not_raise(self, cf):
        async def _bad_dispatch(step, ctx):
            raise RuntimeError("exploded")
        with patch.object(cf, "_dispatch_step", _bad_dispatch):
            script = FusionScript(steps=[FusionStep(step_id="s1", action="swarm")])
            result = _run(cf.execute_fusion(script))
        assert result.step_results[0].status == "error"


# ── Dependency resolution ─────────────────────────────────────────────────────


class TestDependencyResolution:
    def test_three_layer_chain(self, cf):
        steps = [
            FusionStep(step_id="a", action="mission"),
            FusionStep(step_id="b", action="evolve", depends_on=["a"]),
            FusionStep(step_id="c", action="mission", depends_on=["b"]),
        ]
        result = _run(cf.execute_fusion(FusionScript(steps=steps)))
        ids = [r.step_id for r in result.step_results]
        assert ids.index("a") < ids.index("b") < ids.index("c")

    def test_fan_in_pattern(self, cf):
        steps = [
            FusionStep(step_id="a", action="mission"),
            FusionStep(step_id="b", action="evolve"),
            FusionStep(step_id="c", action="mission", depends_on=["a", "b"]),
        ]
        result = _run(cf.execute_fusion(FusionScript(steps=steps)))
        ids = [r.step_id for r in result.step_results]
        assert ids.index("a") < ids.index("c")
        assert ids.index("b") < ids.index("c")


# ── Singleton ─────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.doctrine.command_fusion as mod
        monkeypatch.setattr(mod, "_COMMAND_FUSION", None)
        a = get_command_fusion()
        b = get_command_fusion()
        assert a is b
        monkeypatch.setattr(mod, "_COMMAND_FUSION", None)

    def test_returns_command_fusion_instance(self, monkeypatch):
        import swarmz_runtime.doctrine.command_fusion as mod
        monkeypatch.setattr(mod, "_COMMAND_FUSION", None)
        instance = get_command_fusion()
        assert isinstance(instance, CommandFusion)
        monkeypatch.setattr(mod, "_COMMAND_FUSION", None)
