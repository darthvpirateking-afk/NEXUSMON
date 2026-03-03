"""Tests for the Evolution Engine — award_xp, advance_stage, get_state."""
import pytest
from swarmz_runtime.evolution.stage import EvolutionStage
from swarmz_runtime.evolution import engine as evo_engine


def _fresh(agent_id: str):
    """Remove cached state so each test starts clean."""
    evo_engine._STATES.pop(agent_id, None)
    path = evo_engine._state_path(agent_id)
    if path.exists():
        path.unlink()


def test_get_state_returns_origin_for_new_agent():
    _fresh("test_new")
    state = evo_engine.get_state("test_new")
    assert state.stage == EvolutionStage.ORIGIN
    assert state.xp == 0


def test_award_xp_increases_xp():
    _fresh("test_xp")
    evo_engine.award_xp("test_xp", 100, "test")
    state = evo_engine.get_state("test_xp")
    assert state.xp == 100


def test_award_xp_additive():
    _fresh("test_xp_add")
    evo_engine.award_xp("test_xp_add", 100, "a")
    evo_engine.award_xp("test_xp_add", 50, "b")
    state = evo_engine.get_state("test_xp_add")
    assert state.xp == 150


def test_award_xp_records_history():
    _fresh("test_hist")
    evo_engine.award_xp("test_hist", 10, "mission:abc")
    state = evo_engine.get_state("test_hist")
    assert any(e["event"] == "xp_awarded" and e["source"] == "mission:abc" for e in state.history)


def test_award_xp_zero_is_noop():
    _fresh("test_zero")
    evo_engine.award_xp("test_zero", 0, "noop")
    state = evo_engine.get_state("test_zero")
    assert state.xp == 0
    assert len(state.history) == 0


def test_stage_advances_at_threshold():
    _fresh("test_advance")
    evo_engine.award_xp("test_advance", 500, "grind")
    state = evo_engine.get_state("test_advance")
    assert state.stage == EvolutionStage.EMBODIMENT


def test_stage_advance_recorded_in_history():
    _fresh("test_adv_hist")
    evo_engine.award_xp("test_adv_hist", 500, "grind")
    state = evo_engine.get_state("test_adv_hist")
    assert any(e["event"] == "stage_advance" for e in state.history)


def test_multi_stage_jump():
    _fresh("test_jump")
    # 2000 XP should land at EXECUTION_FRAME (skipping EMBODIMENT at 500)
    evo_engine.award_xp("test_jump", 2000, "overdrive")
    state = evo_engine.get_state("test_jump")
    assert state.stage == EvolutionStage.EXECUTION_FRAME


def test_traits_populated_after_xp():
    _fresh("test_traits")
    evo_engine.award_xp("test_traits", 100, "test")
    state = evo_engine.get_state("test_traits")
    assert "curiosity" in state.trait_scores
    assert state.trait_scores["curiosity"] > 0


def test_traits_only_increase():
    _fresh("test_trait_inc")
    evo_engine.award_xp("test_trait_inc", 50, "a")
    s1 = evo_engine.get_state("test_trait_inc").trait_scores.get("loyalty", 0.0)
    evo_engine.award_xp("test_trait_inc", 50, "b")
    s2 = evo_engine.get_state("test_trait_inc").trait_scores.get("loyalty", 0.0)
    assert s2 >= s1


def test_advance_stage_already_at_max():
    _fresh("test_max")
    evo_engine._STATES["test_max"] = evo_engine._load_state("test_max")
    evo_engine._STATES["test_max"].stage = EvolutionStage.ZERO_POINT
    result = evo_engine.advance_stage("test_max")
    assert result is False


def test_get_state_persistence(tmp_path, monkeypatch):
    monkeypatch.setattr(evo_engine, "_ARTIFACTS_DIR", tmp_path)
    _fresh("test_persist")
    evo_engine.award_xp("test_persist", 99, "save_test")
    # Clear cache to force reload from disk
    evo_engine._STATES.pop("test_persist", None)
    state = evo_engine.get_state("test_persist")
    assert state.xp == 99
