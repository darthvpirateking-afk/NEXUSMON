"""Tests for OperatorMemory — session continuity, relationship state, persistence."""
from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pytest

from swarmz_runtime.operator.memory import (
    MemoryEntry,
    OperatorMemory,
    _compute_relationship,
    get_operator_memory,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def memory(tmp_path, monkeypatch):
    """Fresh OperatorMemory instance with artifacts redirected to tmp_path."""
    import swarmz_runtime.operator.memory as mod
    monkeypatch.setattr(mod, "_OPERATOR_MEMORY", None)
    monkeypatch.setattr(mod, "_ANCHOR_PATH", tmp_path / "no_anchor.json")
    path = tmp_path / "operator" / "memory.jsonl"
    return OperatorMemory(path=path)


# ── MemoryEntry model ─────────────────────────────────────────────────────────


class TestMemoryEntryModel:
    def test_to_dict_keys(self):
        entry = MemoryEntry(name="Regan", session_count=1, total_missions=5,
                            last_seen="2026-01-01T00:00:00+00:00",
                            milestones=["first"], operator_notes="hi",
                            relationship_state="ROOKIE",
                            created_at="2026-01-01T00:00:00+00:00")
        d = entry.to_dict()
        assert set(d.keys()) == {
            "name", "session_count", "total_missions", "last_seen",
            "milestones", "operator_notes", "relationship_state", "created_at"
        }

    def test_from_dict_roundtrip(self):
        original = MemoryEntry(
            name="Regan", session_count=7, total_missions=3,
            last_seen="2026-01-01T00:00:00+00:00", milestones=["m1", "m2"],
            operator_notes="note", relationship_state="TRUSTED",
            created_at="2025-01-01T00:00:00+00:00"
        )
        restored = MemoryEntry.from_dict(original.to_dict())
        assert restored.name == original.name
        assert restored.session_count == original.session_count
        assert restored.milestones == original.milestones

    def test_from_dict_defaults(self):
        entry = MemoryEntry.from_dict({})
        assert entry.name == ""
        assert entry.session_count == 0
        assert entry.milestones == []


# ── Relationship computation ──────────────────────────────────────────────────


class TestRelationship:
    def test_rookie_at_zero(self):
        assert _compute_relationship(0) == "ROOKIE"

    def test_rookie_below_5(self):
        assert _compute_relationship(4) == "ROOKIE"

    def test_trusted_at_5(self):
        assert _compute_relationship(5) == "TRUSTED"

    def test_trusted_at_20(self):
        assert _compute_relationship(20) == "TRUSTED"

    def test_sovereign_above_20(self):
        assert _compute_relationship(21) == "SOVEREIGN"

    def test_sovereign_at_100(self):
        assert _compute_relationship(100) == "SOVEREIGN"


# ── Bootstrap ─────────────────────────────────────────────────────────────────


class TestBootstrap:
    def test_bootstrap_returns_default_regan(self, memory):
        entry = memory._bootstrap()
        assert entry.name == ""
        assert entry.session_count == 0

    def test_bootstrap_reads_regan_anchor_if_present(self, tmp_path, monkeypatch):
        import swarmz_runtime.operator.memory as mod
        anchor_path = tmp_path / "regan_anchor.json"
        anchor_path.write_text(json.dumps({
            "operator": "Regan Stewart Harris",
            "timestamp": "2026-02-28T20:21:02.762748+00:00",
        }), encoding="utf-8")
        monkeypatch.setattr(mod, "_ANCHOR_PATH", anchor_path)
        mem = OperatorMemory(path=tmp_path / "operator" / "memory.jsonl")
        entry = mem._bootstrap()
        assert entry.name == "Regan Stewart Harris"
        assert entry.created_at == "2026-02-28T20:21:02.762748+00:00"

    def test_bootstrap_tolerates_missing_anchor(self, memory):
        entry = memory._bootstrap()
        assert entry.name == ""
        assert entry.created_at != ""


# ── Load ──────────────────────────────────────────────────────────────────────


class TestLoad:
    def test_load_returns_bootstrap_when_file_absent(self, memory):
        entry = memory.load()
        assert entry.name == ""
        assert entry.session_count == 0

    def test_load_returns_last_valid_entry(self, memory):
        # Write two entries and confirm load returns the last
        e1 = MemoryEntry(name="Regan", session_count=1, total_missions=0,
                         last_seen="2026-01-01T00:00:00+00:00",
                         milestones=[], operator_notes="",
                         relationship_state="ROOKIE",
                         created_at="2026-01-01T00:00:00+00:00")
        e2 = MemoryEntry(name="Regan", session_count=2, total_missions=0,
                         last_seen="2026-01-02T00:00:00+00:00",
                         milestones=[], operator_notes="",
                         relationship_state="ROOKIE",
                         created_at="2026-01-01T00:00:00+00:00")
        memory._append(e1)
        memory._append(e2)
        entry = memory.load()
        assert entry.session_count == 2

    def test_load_skips_malformed_lines(self, memory):
        memory._path.parent.mkdir(parents=True, exist_ok=True)
        memory._path.write_text("not-json\n", encoding="utf-8")
        entry = memory.load()
        assert entry.session_count == 0  # falls back to bootstrap


# ── Record session ────────────────────────────────────────────────────────────


class TestRecordSession:
    def test_first_session_creates_record(self, memory):
        entry = memory.record_session()
        assert entry.session_count == 1
        assert memory._path.exists()

    def test_session_count_increments(self, memory):
        memory.record_session()
        memory.record_session()
        entry = memory.record_session()
        assert entry.session_count == 3

    def test_last_seen_is_set(self, memory):
        entry = memory.record_session()
        assert entry.last_seen != ""

    def test_relationship_updates_after_enough_sessions(self, memory):
        for _ in range(5):
            entry = memory.record_session()
        assert entry.relationship_state == "TRUSTED"

    def test_relationship_state_rookie_trusted_sovereign(self, memory):
        # ROOKIE: 0–4 sessions
        for _ in range(4):
            entry = memory.record_session()
        assert entry.relationship_state == "ROOKIE"
        # TRUSTED: 5–20 sessions
        entry = memory.record_session()
        assert entry.relationship_state == "TRUSTED"
        # SOVEREIGN: 21+ sessions
        for _ in range(16):
            entry = memory.record_session()
        assert entry.relationship_state == "SOVEREIGN"


# ── Introduce ─────────────────────────────────────────────────────────────────


class TestIntroduce:
    def test_introduce_sets_name(self, memory):
        entry = memory.introduce("Harris")
        assert entry.name == "Harris"

    def test_introduce_first_time_only(self, memory):
        memory.introduce("Regan")
        entry = memory.introduce("Other")
        assert entry.name == "Regan"

    def test_greet_returns_name_after_introduce(self, memory):
        memory.record_session()
        memory.introduce("Regan")
        greeting = memory.greet()
        assert "Regan" in greeting

    def test_introduce_empty_raises(self, memory):
        with pytest.raises(ValueError):
            memory.introduce("")

    def test_introduce_whitespace_raises(self, memory):
        with pytest.raises(ValueError):
            memory.introduce("   ")

    def test_introduce_persists(self, memory):
        memory.introduce("Regan")
        entry = memory.load()
        assert entry.name == "Regan"


# ── Add note ──────────────────────────────────────────────────────────────────


class TestAddNote:
    def test_add_note_persists(self, memory):
        memory.add_note("test note")
        entry = memory.load()
        assert "test note" in entry.operator_notes

    def test_add_note_appends(self, memory):
        memory.add_note("first")
        memory.add_note("second")
        entry = memory.load()
        assert "first" in entry.operator_notes
        assert "second" in entry.operator_notes

    def test_empty_note_no_op(self, memory):
        entry_before = memory.load()
        memory.add_note("")
        entry_after = memory.load()
        assert entry_before.operator_notes == entry_after.operator_notes


# ── Milestones ────────────────────────────────────────────────────────────────


class TestMilestones:
    def test_milestone_persists(self, memory):
        memory.record_milestone("First mission complete")
        entry = memory.load()
        assert "First mission complete" in entry.milestones

    def test_milestone_accumulates(self, memory):
        memory.record_milestone("alpha")
        memory.record_milestone("beta")
        entry = memory.load()
        assert "alpha" in entry.milestones
        assert "beta" in entry.milestones

    def test_empty_milestone_no_op(self, memory):
        before = memory.load()
        memory.record_milestone("")
        after = memory.load()
        assert len(before.milestones) == len(after.milestones)


# ── Greet ─────────────────────────────────────────────────────────────────────


class TestGreet:
    def test_greet_unregistered(self, memory):
        greeting = memory.greet()
        assert greeting == "Operator identity unregistered. Who are you?"

    def test_greet_known_operator(self, memory):
        memory.record_session()
        memory.introduce("Regan")
        greeting = memory.greet()
        assert greeting == "Welcome back Regan. Session 1. 0 missions together."

    def test_long_absence_detected(self, memory):
        # Write an entry with last_seen 10 days ago
        old_ts = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        entry = MemoryEntry(
            name="Regan", session_count=5, total_missions=3,
            last_seen=old_ts, milestones=[], operator_notes="",
            relationship_state="TRUSTED",
            created_at="2026-01-01T00:00:00+00:00"
        )
        memory._append(entry)
        greeting = memory.greet()
        assert greeting == "You were gone 10 days. Systems maintained. Ready."

    def test_recent_session_no_absence_message(self, memory):
        # Write an entry with last_seen yesterday
        recent_ts = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        entry = MemoryEntry(
            name="Regan", session_count=3, total_missions=0,
            last_seen=recent_ts, milestones=[], operator_notes="",
            relationship_state="ROOKIE",
            created_at="2026-01-01T00:00:00+00:00"
        )
        memory._append(entry)
        greeting = memory.greet()
        assert "Welcome back" in greeting


# ── Singleton ─────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.operator.memory as mod
        monkeypatch.setattr(mod, "_OPERATOR_MEMORY", None)
        a = get_operator_memory()
        b = get_operator_memory()
        assert a is b
        monkeypatch.setattr(mod, "_OPERATOR_MEMORY", None)

    def test_returns_operator_memory_instance(self, monkeypatch):
        import swarmz_runtime.operator.memory as mod
        monkeypatch.setattr(mod, "_OPERATOR_MEMORY", None)
        instance = get_operator_memory()
        assert isinstance(instance, OperatorMemory)
        monkeypatch.setattr(mod, "_OPERATOR_MEMORY", None)
