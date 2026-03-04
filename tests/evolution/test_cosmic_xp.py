"""Tests for cosmic XP wiring in evolution engine — Task 7 of v2.1.0."""
from __future__ import annotations

import pytest

from swarmz_runtime.evolution.engine import award_cosmic_xp, get_state, _COSMIC_XP_TABLE


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def fresh_agent(tmp_path, monkeypatch):
    """Fresh agent state backed by tmp_path."""
    import swarmz_runtime.evolution.engine as mod
    monkeypatch.setattr(mod, "_ARTIFACTS_DIR", tmp_path / "evolution")
    monkeypatch.setattr(mod, "_STATES", {})
    return "cosmic-test-agent"


# ---------------------------------------------------------------------------
# XP table coverage
# ---------------------------------------------------------------------------

def test_xp_table_surface_query():
    assert _COSMIC_XP_TABLE[("query", "SURFACE")] == 100


def test_xp_table_deep_query():
    assert _COSMIC_XP_TABLE[("query", "DEEP")] == 250


def test_xp_table_profound_query():
    assert _COSMIC_XP_TABLE[("query", "PROFOUND")] == 500


def test_xp_table_deep_query_multiscale():
    assert _COSMIC_XP_TABLE[("deep_query", None)] == 750


def test_xp_table_timeline():
    assert _COSMIC_XP_TABLE[("timeline", None)] == 200


def test_xp_table_worldspace_add():
    assert _COSMIC_XP_TABLE[("worldspace_add", None)] == 50


def test_xp_table_worldspace_connect():
    assert _COSMIC_XP_TABLE[("worldspace_connect", None)] == 75


def test_xp_table_worldspace_synthesize():
    assert _COSMIC_XP_TABLE[("worldspace_synthesize", None)] == 300


# ---------------------------------------------------------------------------
# award_cosmic_xp — XP awarded correctly
# ---------------------------------------------------------------------------

def test_cosmic_xp_surface_query(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "query", depth="SURFACE")
    assert state.xp == 100


def test_cosmic_xp_profound_query(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "query", depth="PROFOUND")
    assert state.xp == 500


def test_cosmic_xp_timeline(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "timeline")
    assert state.xp == 200


def test_cosmic_xp_worldspace_add(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "worldspace_add")
    assert state.xp == 50


def test_cosmic_xp_accumulates(fresh_agent: str):
    award_cosmic_xp(fresh_agent, "query", depth="SURFACE")   # +100
    award_cosmic_xp(fresh_agent, "timeline")                  # +200
    state = award_cosmic_xp(fresh_agent, "worldspace_add")    # +50
    assert state.xp == 350


# ---------------------------------------------------------------------------
# Trait gains
# ---------------------------------------------------------------------------

def test_curiosity_gained_on_query(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "query", depth="DEEP")
    assert state.trait_scores.get("curiosity", 0) >= 3


def test_patience_gained_on_profound(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "query", depth="PROFOUND")
    assert state.trait_scores.get("patience", 0) >= 1


def test_creativity_gained_on_deep_query(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "deep_query")
    assert state.trait_scores.get("creativity", 0) >= 2


def test_autonomy_gained_on_long_timeline(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "timeline", year_span=2_000_000_000)
    assert state.trait_scores.get("autonomy", 0) >= 2


def test_autonomy_not_gained_on_short_timeline(fresh_agent: str):
    state = award_cosmic_xp(fresh_agent, "timeline", year_span=500)
    assert state.trait_scores.get("autonomy", 0) == 0


# ---------------------------------------------------------------------------
# COSMIC SIGHT unlock
# ---------------------------------------------------------------------------

def test_cosmic_sight_unlocks_at_ten_queries(fresh_agent: str):
    for _ in range(10):
        award_cosmic_xp(fresh_agent, "query", depth="SURFACE")
    state = get_state(fresh_agent)
    assert state.trait_scores.get("cosmic_sight") is True


def test_cosmic_sight_not_unlocked_before_ten(fresh_agent: str):
    for _ in range(9):
        award_cosmic_xp(fresh_agent, "query", depth="SURFACE")
    state = get_state(fresh_agent)
    assert not state.trait_scores.get("cosmic_sight")


def test_cosmic_sight_event_in_history(fresh_agent: str):
    for _ in range(10):
        award_cosmic_xp(fresh_agent, "query", depth="SURFACE")
    state = get_state(fresh_agent)
    events = [h["event"] for h in state.history]
    assert "cosmic_sight_unlocked" in events


def test_cosmic_sight_only_logged_once(fresh_agent: str):
    for _ in range(15):
        award_cosmic_xp(fresh_agent, "query", depth="SURFACE")
    state = get_state(fresh_agent)
    unlock_events = [h for h in state.history if h["event"] == "cosmic_sight_unlocked"]
    assert len(unlock_events) == 1
