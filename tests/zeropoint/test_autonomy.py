"""Tests for AutonomyEngine — operator-supervised action proposal queue."""
from __future__ import annotations

import asyncio

import pytest

from swarmz_runtime.zeropoint.autonomy import AutonomyEngine, Proposal, get_autonomy_engine

_OP_KEY = "swarmz_sovereign_key"
_BAD_KEY = "wrong_key"

_SAMPLE_STEPS = [
    {"step_id": "s1", "action": "swarm", "params": {"goal": "test"}, "depends_on": None}
]


# ── Fixtures ───────────────────────────────────────────────────────────────────


@pytest.fixture()
def ae(tmp_path, monkeypatch):
    """Fresh AutonomyEngine backed by a temp JSONL file."""
    import swarmz_runtime.zeropoint.autonomy as mod
    monkeypatch.setattr(mod, "_AUTONOMY_ENGINE", None)
    queue_file = tmp_path / "autonomy_queue.jsonl"
    return AutonomyEngine(queue_file=queue_file)


@pytest.fixture()
def bypass_fusion(monkeypatch):
    """Patch CommandFusion so approve() doesn't need real subsystems."""
    from swarmz_runtime.doctrine.command_fusion import FusionResult
    fake_result = FusionResult(
        fusion_id="fake123",
        name="test",
        status="complete",
        step_results=[],
        created_at="2026-01-01T00:00:00+00:00",
        completed_at="2026-01-01T00:00:01+00:00",
    )

    async def _fake_execute(self, script):
        return fake_result

    monkeypatch.setattr(
        "swarmz_runtime.doctrine.command_fusion.CommandFusion.execute_fusion",
        _fake_execute,
    )


# ── Proposal model ─────────────────────────────────────────────────────────────


class TestProposalModel:
    def test_to_dict_keys(self):
        p = Proposal(
            proposal_id="abc",
            title="Test",
            rationale="because",
            steps=_SAMPLE_STEPS,
            proposed_at="2026-01-01T00:00:00+00:00",
        )
        d = p.to_dict()
        assert set(d.keys()) == {
            "proposal_id", "title", "rationale", "steps",
            "proposed_at", "status", "decided_at", "outcome",
        }

    def test_default_status_is_pending(self):
        p = Proposal(
            proposal_id="x", title="T", rationale="", steps=[], proposed_at="now"
        )
        assert p.status == "pending"

    def test_from_dict_roundtrip(self):
        d = {
            "proposal_id": "abc",
            "title": "Test",
            "rationale": "because",
            "steps": _SAMPLE_STEPS,
            "proposed_at": "2026-01-01T00:00:00+00:00",
            "status": "approved",
            "decided_at": "2026-01-01T01:00:00+00:00",
            "outcome": {"fusion_id": "fake"},
        }
        p = Proposal.from_dict(d)
        assert p.proposal_id == "abc"
        assert p.status == "approved"


# ── propose ────────────────────────────────────────────────────────────────────


class TestPropose:
    def test_propose_returns_proposal(self, ae):
        p = ae.propose("Test proposal", _SAMPLE_STEPS, "some rationale")
        assert isinstance(p, Proposal)
        assert p.title == "Test proposal"
        assert p.status == "pending"

    def test_propose_persists_entry(self, ae):
        ae.propose("Test", _SAMPLE_STEPS)
        entries = ae._read_entries()
        assert len(entries) == 1
        assert entries[0]["type"] == "propose"

    def test_propose_empty_title_raises(self, ae):
        with pytest.raises(ValueError, match="title"):
            ae.propose("", _SAMPLE_STEPS)

    def test_propose_empty_steps_raises(self, ae):
        with pytest.raises(ValueError, match="step"):
            ae.propose("Test", [])

    def test_propose_generates_unique_ids(self, ae):
        p1 = ae.propose("P1", _SAMPLE_STEPS)
        p2 = ae.propose("P2", _SAMPLE_STEPS)
        assert p1.proposal_id != p2.proposal_id

    def test_propose_appears_in_queue(self, ae):
        ae.propose("Test", _SAMPLE_STEPS)
        assert len(ae.pending_queue()) == 1


# ── reject ─────────────────────────────────────────────────────────────────────


class TestReject:
    def test_reject_returns_status(self, ae):
        p = ae.propose("Test", _SAMPLE_STEPS)
        result = ae.reject(p.proposal_id, reason="not needed")
        assert result["status"] == "rejected"
        assert result["proposal_id"] == p.proposal_id

    def test_reject_removes_from_queue(self, ae):
        p = ae.propose("Test", _SAMPLE_STEPS)
        ae.reject(p.proposal_id)
        assert len(ae.pending_queue()) == 0

    def test_reject_unknown_id_raises(self, ae):
        with pytest.raises(ValueError):
            ae.reject("nonexistent")

    def test_reject_already_rejected_raises(self, ae):
        p = ae.propose("Test", _SAMPLE_STEPS)
        ae.reject(p.proposal_id)
        with pytest.raises(ValueError, match="already"):
            ae.reject(p.proposal_id)

    def test_reject_logs_entry(self, ae):
        p = ae.propose("Test", _SAMPLE_STEPS)
        ae.reject(p.proposal_id, reason="no")
        entries = ae._read_entries()
        reject_entries = [e for e in entries if e.get("type") == "reject"]
        assert len(reject_entries) == 1
        assert reject_entries[0]["reason"] == "no"


# ── approve ────────────────────────────────────────────────────────────────────


class TestApprove:
    def test_approve_valid_key(self, ae, bypass_fusion):
        p = ae.propose("Test", _SAMPLE_STEPS)
        result = ae.approve(p.proposal_id, _OP_KEY)
        assert result["status"] == "approved"

    def test_approve_invalid_key_raises(self, ae):
        p = ae.propose("Test", _SAMPLE_STEPS)
        with pytest.raises(Exception):
            ae.approve(p.proposal_id, _BAD_KEY)

    def test_approve_unknown_id_raises(self, ae):
        with pytest.raises(ValueError):
            ae.approve("nonexistent", _OP_KEY)

    def test_approve_removes_from_queue(self, ae, bypass_fusion):
        p = ae.propose("Test", _SAMPLE_STEPS)
        ae.approve(p.proposal_id, _OP_KEY)
        assert len(ae.pending_queue()) == 0

    def test_approve_already_approved_raises(self, ae, bypass_fusion):
        p = ae.propose("Test", _SAMPLE_STEPS)
        ae.approve(p.proposal_id, _OP_KEY)
        with pytest.raises(ValueError, match="already"):
            ae.approve(p.proposal_id, _OP_KEY)


# ── pending_queue and history ─────────────────────────────────────────────────


class TestQueueAndHistory:
    def test_pending_empty_initially(self, ae):
        assert ae.pending_queue() == []

    def test_pending_shows_unresolved(self, ae):
        ae.propose("P1", _SAMPLE_STEPS)
        ae.propose("P2", _SAMPLE_STEPS)
        assert len(ae.pending_queue()) == 2

    def test_history_includes_all(self, ae, bypass_fusion):
        p1 = ae.propose("P1", _SAMPLE_STEPS)
        p2 = ae.propose("P2", _SAMPLE_STEPS)
        ae.approve(p1.proposal_id, _OP_KEY)
        ae.reject(p2.proposal_id)
        history = ae.history()
        assert len(history) == 2

    def test_history_shows_correct_statuses(self, ae, bypass_fusion):
        p1 = ae.propose("P1", _SAMPLE_STEPS)
        p2 = ae.propose("P2", _SAMPLE_STEPS)
        ae.approve(p1.proposal_id, _OP_KEY)
        ae.reject(p2.proposal_id)
        history = ae.history()
        statuses = {h["proposal_id"]: h["status"] for h in history}
        assert statuses[p1.proposal_id] == "approved"
        assert statuses[p2.proposal_id] == "rejected"

    def test_pending_not_decided_only(self, ae, bypass_fusion):
        p1 = ae.propose("P1", _SAMPLE_STEPS)
        p2 = ae.propose("P2", _SAMPLE_STEPS)
        ae.approve(p1.proposal_id, _OP_KEY)
        queue = ae.pending_queue()
        assert len(queue) == 1
        assert queue[0]["proposal_id"] == p2.proposal_id


# ── Singleton ──────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.zeropoint.autonomy as mod
        monkeypatch.setattr(mod, "_AUTONOMY_ENGINE", None)
        a = get_autonomy_engine()
        b = get_autonomy_engine()
        assert a is b
        monkeypatch.setattr(mod, "_AUTONOMY_ENGINE", None)

    def test_returns_correct_type(self, monkeypatch):
        import swarmz_runtime.zeropoint.autonomy as mod
        monkeypatch.setattr(mod, "_AUTONOMY_ENGINE", None)
        assert isinstance(get_autonomy_engine(), AutonomyEngine)
        monkeypatch.setattr(mod, "_AUTONOMY_ENGINE", None)
