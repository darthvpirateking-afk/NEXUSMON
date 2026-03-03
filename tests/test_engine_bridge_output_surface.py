from __future__ import annotations

from swarmz_runtime.core import engine as engine_module
from swarmz_runtime.core.engine import SwarmzEngine


class _ValidationScores:
    def model_dump(self) -> dict[str, float]:
        return {}


class _ValidationResult:
    failing = False
    requires_approval = False
    safe = True
    borderline = False
    scores = _ValidationScores()

    def model_dump(self) -> dict[str, object]:
        return {
            "safe": True,
            "borderline": False,
            "failing": False,
            "requires_approval": False,
            "scores": {},
        }


def test_run_mission_completed_includes_bridge_surface_fields(
    tmp_path, monkeypatch
) -> None:
    monkeypatch.setattr(
        engine_module, "validate_transaction", lambda _mission: _ValidationResult()
    )
    monkeypatch.setattr(engine_module, "should_execute", lambda _mission: True)

    engine = SwarmzEngine(data_dir=str(tmp_path / "runtime-data"))
    created = engine.create_mission(
        goal="Bridge surface test",
        category="library",
        constraints={},
        mode=None,
    )
    assert created.get("ok") is True

    mission_id = str(created["mission_id"])
    result = engine.run_mission(
        mission_id=mission_id,
        operator_key="swarmz_sovereign_key",
    )

    assert result.get("status") == "completed"
    assert "mission_id" in result
    assert "roi" in result
    assert "next_run" in result
    assert "rune_created" in result
    assert "mode" in result
    assert "bridge_output" in result
    assert result["mode"] is None
    assert result["bridge_output"] is None
