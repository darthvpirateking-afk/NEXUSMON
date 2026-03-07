# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
"""
tests/test_reversible.py — Reversible Layer Tests

Validates snapshot/restore functionality and exactly-once guarantees.
"""

import pytest
import core.reversible as reversible_module
from core.reversible import (
    ReversibleLayer,
    begin_transaction,
    commit,
    rollback,
    evaluate,
    get_snapshot,
    list_active_snapshots,
)


def _layer(tmp_path):
    return ReversibleLayer(tmp_path / "reversible_snapshots.jsonl")


def test_begin_transaction(tmp_path):
    """Should create snapshot and return snapshot_id."""
    layer = _layer(tmp_path)
    snapshot_id = layer.begin_transaction(
        action_id="test_action_1",
        state_description="Test state before action",
        artifacts=["artifact_1", "artifact_2"],
        metrics={"budget": 100.0},
    )

    assert snapshot_id is not None
    snapshot = layer.get_snapshot(snapshot_id)
    assert snapshot is not None
    assert snapshot.action_id == "test_action_1"
    assert snapshot.artifacts == ["artifact_1", "artifact_2"]
    assert snapshot.metrics == {"budget": 100.0}
    assert not snapshot.committed
    assert not snapshot.rolled_back


def test_commit_snapshot(tmp_path):
    """Should mark snapshot as committed."""
    layer = _layer(tmp_path)
    snapshot_id = layer.begin_transaction("action_1", "state before")

    result = layer.commit(snapshot_id)

    assert result.passed
    assert result.layer == "reversible"
    assert "committed" in result.reason.lower()

    snapshot = layer.get_snapshot(snapshot_id)
    assert snapshot.committed
    assert not snapshot.rolled_back


def test_rollback_snapshot(tmp_path):
    """Should restore state and mark as rolled back."""
    layer = _layer(tmp_path)
    snapshot_id = layer.begin_transaction(
        "action_1",
        "state before",
        artifacts=["art_1"],
        metrics={"count": 5},
    )

    result = layer.rollback(snapshot_id)

    assert result.passed
    assert result.layer == "reversible"
    assert "restored" in result.reason.lower()
    assert result.metadata["artifacts_restored"] == ["art_1"]
    assert result.metadata["metrics_baseline"] == {"count": 5}

    snapshot = layer.get_snapshot(snapshot_id)
    assert snapshot.rolled_back
    assert not snapshot.committed


def test_rollback_exactly_once(tmp_path):
    """Should prevent double rollback (exactly-once guarantee)."""
    layer = _layer(tmp_path)
    snapshot_id = layer.begin_transaction("action_1", "state")

    result1 = layer.rollback(snapshot_id)
    assert result1.passed

    result2 = layer.rollback(snapshot_id)
    assert not result2.passed
    assert "already rolled back" in result2.reason.lower()


def test_cannot_commit_after_rollback(tmp_path):
    """Should prevent commit after rollback."""
    layer = _layer(tmp_path)
    snapshot_id = layer.begin_transaction("action_1", "state")

    layer.rollback(snapshot_id)
    result = layer.commit(snapshot_id)

    assert not result.passed
    assert "rolled-back" in result.reason.lower()


def test_cannot_rollback_after_commit(tmp_path):
    """Should prevent rollback after commit."""
    layer = _layer(tmp_path)
    snapshot_id = layer.begin_transaction("action_1", "state")

    layer.commit(snapshot_id)
    result = layer.rollback(snapshot_id)

    assert not result.passed
    assert "committed" in result.reason.lower()


def test_list_active_snapshots(tmp_path):
    """Should return only uncommitted, non-rolled-back snapshots."""
    layer = _layer(tmp_path)

    snap1 = layer.begin_transaction("action_1", "state1")
    snap2 = layer.begin_transaction("action_2", "state2")
    snap3 = layer.begin_transaction("action_3", "state3")

    layer.commit(snap1)
    layer.rollback(snap2)
    # snap3 remains active

    active = layer.list_active_snapshots()
    active_ids = [s.snapshot_id for s in active]

    assert snap1 not in active_ids
    assert snap2 not in active_ids
    assert snap3 in active_ids


def test_evaluate_always_passes():
    """Reversible layer always passes (opt-in safety)."""
    result = evaluate({}, {})

    assert result.passed
    assert result.layer == "reversible"
    assert result.metadata["rollback_available"]


def test_module_level_functions(tmp_path, monkeypatch):
    """Module-level convenience functions should work."""
    monkeypatch.setattr(reversible_module, "_reversible", _layer(tmp_path))
    snapshot_id = begin_transaction("test_action", "test state")
    assert snapshot_id is not None

    snapshot = get_snapshot(snapshot_id)
    assert snapshot is not None

    result = commit(snapshot_id)
    assert result.passed

    snapshot_id2 = begin_transaction("test_action2", "state2")
    result2 = rollback(snapshot_id2)
    assert result2.passed


def test_malformed_snapshot_line_is_skipped(tmp_path):
    snapshots_file = tmp_path / "reversible_snapshots.jsonl"
    snapshots_file.write_text(
        "\n".join(
            [
                '{"snapshot_id":"one","action_id":"a","state_description":"ok","artifacts":[],"metrics":{},"created_at":1.0,"committed":false,"rolled_back":false}',
                ': 1.0, "committed": false, "rolled_back": false}',
                '{"snapshot_id":"two","action_id":"b","state_description":"ok2","artifacts":[],"metrics":{},"created_at":2.0,"committed":true,"rolled_back":false}',
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    layer = ReversibleLayer(snapshots_file)

    assert layer.skipped_snapshot_lines == 1
    assert layer.get_snapshot("one") is not None
    assert layer.get_snapshot("two") is not None


def test_invalid_utf8_snapshot_bytes_are_skipped(tmp_path):
    snapshots_file = tmp_path / "reversible_snapshots.jsonl"
    snapshots_file.write_bytes(
        b'{"snapshot_id":"one","action_id":"a","state_description":"ok","artifacts":[],"metrics":{},"created_at":1.0,"committed":false,"rolled_back":false}\n'
        + b'\xff\xfe\x80not-json\n'
        + b'{"snapshot_id":"two","action_id":"b","state_description":"ok2","artifacts":[],"metrics":{},"created_at":2.0,"committed":true,"rolled_back":false}\n'
    )

    layer = ReversibleLayer(snapshots_file)

    assert layer.skipped_snapshot_lines == 1
    assert layer.get_snapshot("one") is not None
    assert layer.get_snapshot("two") is not None
