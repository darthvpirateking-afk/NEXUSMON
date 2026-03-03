"""Tests for EvolutionStage definitions and EvolutionState."""
import pytest
from swarmz_runtime.evolution.stage import (
    EvolutionStage,
    EvolutionState,
    STAGE_DEFS,
    STAGE_ORDER,
)


def test_stage_order_is_five():
    assert len(STAGE_ORDER) == 5


def test_stage_defs_complete():
    for stage in EvolutionStage:
        assert stage in STAGE_DEFS


def test_xp_thresholds_increasing():
    thresholds = [STAGE_DEFS[s].xp_threshold for s in STAGE_ORDER]
    assert thresholds == sorted(thresholds)


def test_origin_threshold_is_zero():
    assert STAGE_DEFS[EvolutionStage.ORIGIN].xp_threshold == 0


def test_each_stage_unlocks_traits():
    # Every stage except ZERO_POINT unlocks at least one trait
    for stage in STAGE_ORDER[:-1]:
        assert len(STAGE_DEFS[stage].traits_unlocked) >= 1


def test_visual_state_strings():
    for stage in EvolutionStage:
        assert isinstance(STAGE_DEFS[stage].visual_state, str)
        assert len(STAGE_DEFS[stage].visual_state) > 0


def test_evolution_state_defaults():
    s = EvolutionState(agent_id="test")
    assert s.stage == EvolutionStage.ORIGIN
    assert s.xp == 0
    assert s.trait_scores == {}
    assert s.history == []


def test_to_dict_structure():
    s = EvolutionState(agent_id="nexusmon", xp=100)
    d = s.to_dict()
    assert d["agent_id"] == "nexusmon"
    assert d["stage"] == "ORIGIN"
    assert d["xp"] == 100
    assert "xp_pct" in d
    assert "next_stage" in d
    assert "next_threshold" in d
    assert "trait_scores" in d
    assert "history" in d


def test_to_dict_xp_pct_at_zero():
    s = EvolutionState(agent_id="nexusmon", xp=0)
    d = s.to_dict()
    assert d["xp_pct"] == 0.0


def test_to_dict_xp_pct_halfway():
    # ORIGIN→EMBODIMENT threshold is 500; halfway = 250 XP
    s = EvolutionState(agent_id="nexusmon", xp=250)
    d = s.to_dict()
    assert d["xp_pct"] == 50.0


def test_to_dict_no_next_stage_at_max():
    s = EvolutionState(agent_id="nexusmon", stage=EvolutionStage.ZERO_POINT, xp=99999)
    d = s.to_dict()
    assert d["next_stage"] is None
    assert d["next_threshold"] is None


def test_history_truncated_to_20():
    s = EvolutionState(agent_id="nexusmon", history=[{"x": i} for i in range(50)])
    d = s.to_dict()
    assert len(d["history"]) == 20
