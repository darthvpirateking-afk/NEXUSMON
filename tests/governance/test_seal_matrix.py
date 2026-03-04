"""Tests for SealMatrix — OPEN, OPERATOR, DUAL, SOVEREIGN approval levels."""
from __future__ import annotations

import hashlib
from pathlib import Path
from unittest.mock import patch

import pytest

from swarmz_runtime.governance.seal_matrix import (
    ApprovalResult,
    SealLevel,
    SealMatrix,
    get_seal_matrix,
)

_OP_KEY = "swarmz_sovereign_key"
_BAD_KEY = "wrong_key"


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def sm(monkeypatch):
    """Fresh SealMatrix singleton reset."""
    import swarmz_runtime.governance.seal_matrix as mod
    monkeypatch.setattr(mod, "_SEAL_MATRIX", None)
    matrix = SealMatrix()
    return matrix


# ── ApprovalResult model ──────────────────────────────────────────────────────


class TestApprovalResultModel:
    def test_to_dict_keys(self):
        r = ApprovalResult(approved=True, action="/v1/test", seal_level="OPERATOR",
                           reason="ok", token=None)
        d = r.to_dict()
        assert set(d.keys()) == {"approved", "action", "seal_level", "reason", "token"}

    def test_to_dict_values(self):
        r = ApprovalResult(approved=False, action="/v1/legacy/seal", seal_level="SOVEREIGN",
                           reason="hash mismatch", token=None)
        d = r.to_dict()
        assert d["approved"] is False
        assert d["seal_level"] == "SOVEREIGN"


# ── SealLevel enum ────────────────────────────────────────────────────────────


class TestSealLevelEnum:
    def test_ordering(self):
        assert SealLevel.OPEN < SealLevel.OPERATOR < SealLevel.DUAL < SealLevel.SOVEREIGN

    def test_values(self):
        assert SealLevel.OPEN == 0
        assert SealLevel.SOVEREIGN == 3


# ── OPEN actions ──────────────────────────────────────────────────────────────


class TestOpenApproval:
    def test_unregistered_action_is_open(self, sm):
        result = sm.approve("/v1/missions/list", "")
        assert result.approved is True
        assert result.seal_level == "OPEN"

    def test_open_needs_no_key(self, sm):
        sm._registry["/v1/test/open"] = SealLevel.OPEN
        result = sm.approve("/v1/test/open", "")
        assert result.approved is True


# ── OPERATOR actions ──────────────────────────────────────────────────────────


class TestOperatorApproval:
    def test_operator_valid_key_approved(self, sm):
        result = sm.approve("/v1/kernel/shift", _OP_KEY)
        assert result.approved is True
        assert result.seal_level == "OPERATOR"

    def test_operator_invalid_key_denied(self, sm):
        result = sm.approve("/v1/kernel/shift", _BAD_KEY)
        assert result.approved is False

    def test_operator_empty_key_denied(self, sm):
        result = sm.approve("/v1/kernel/shift", "")
        assert result.approved is False

    def test_shadow_execute_operator_level(self, sm):
        assert sm._registry["/v1/shadow/execute"] == SealLevel.OPERATOR

    def test_federation_coordinate_operator_level(self, sm):
        assert sm._registry["/v1/federation/coordinate"] == SealLevel.OPERATOR


# ── DUAL actions ──────────────────────────────────────────────────────────────


class TestDualApproval:
    def test_dual_first_call_returns_pending(self, sm):
        result = sm.approve("/v1/kernel/rollback", _OP_KEY)
        assert result.approved is False
        assert result.seal_level == "DUAL"
        assert result.token is not None

    def test_dual_second_call_approved(self, sm):
        sm.approve("/v1/kernel/rollback", _OP_KEY)
        result = sm.approve("/v1/kernel/rollback", _OP_KEY)
        assert result.approved is True
        assert result.seal_level == "DUAL"

    def test_dual_second_call_clears_pending(self, sm):
        sm.approve("/v1/kernel/rollback", _OP_KEY)
        sm.approve("/v1/kernel/rollback", _OP_KEY)
        assert "/v1/kernel/rollback" not in sm._pending_approvals

    def test_dual_invalid_key_denied_on_first(self, sm):
        result = sm.approve("/v1/kernel/rollback", _BAD_KEY)
        assert result.approved is False

    def test_submit_dual_approval_stores_token(self, sm):
        token = sm.submit_dual_approval("/v1/kernel/rollback", _OP_KEY)
        assert token is not None
        assert "/v1/kernel/rollback" in sm._pending_approvals

    def test_submit_dual_approval_invalid_key_raises(self, sm):
        with pytest.raises(Exception):
            sm.submit_dual_approval("/v1/kernel/rollback", _BAD_KEY)

    def test_offworld_activate_dual_level(self, sm):
        assert sm._registry["/v1/offworld/activate"] == SealLevel.DUAL


# ── SOVEREIGN actions ─────────────────────────────────────────────────────────


class TestSovereignApproval:
    def test_sovereign_no_hash_denied_with_hint(self, sm):
        result = sm.approve("/v1/legacy/seal", _OP_KEY, provided_hash=None)
        assert result.approved is False
        assert result.seal_level == "SOVEREIGN"
        assert "hash" in result.reason.lower()

    def test_sovereign_wrong_hash_denied(self, sm):
        result = sm.approve("/v1/legacy/seal", _OP_KEY, provided_hash="deadbeef")
        assert result.approved is False

    def test_sovereign_correct_hash_approved(self, sm, monkeypatch):
        import swarmz_runtime.governance.seal_matrix as mod
        # Make the doctrine hash return a known value
        monkeypatch.setattr(sm, "_get_doctrine_hash", lambda: "abc123def456")
        sm._doctrine_hash_cache = "abc123def456"
        result = sm.approve("/v1/legacy/seal", _OP_KEY, provided_hash="abc123def456")
        assert result.approved is True

    def test_sovereign_invalid_key_denied_before_hash_check(self, sm):
        result = sm.approve("/v1/legacy/seal", _BAD_KEY, provided_hash="any")
        assert result.approved is False

    def test_genome_import_sovereign_level(self, sm):
        assert sm._registry["/v1/genome/import"] == SealLevel.SOVEREIGN

    def test_continuity_generate_sovereign_level(self, sm):
        assert sm._registry["/v1/legacy/continuity/generate"] == SealLevel.SOVEREIGN

    def test_legacy_seal_sovereign_level(self, sm):
        assert sm._registry["/v1/legacy/seal"] == SealLevel.SOVEREIGN


# ── Doctrine hash ─────────────────────────────────────────────────────────────


class TestDoctrineHash:
    def test_doctrine_hash_is_sha256(self, sm, tmp_path, monkeypatch):
        import swarmz_runtime.governance.seal_matrix as mod
        doctrine = tmp_path / "NEXUSMON_DOCTRINE.md"
        doctrine.write_bytes(b"test doctrine content")
        monkeypatch.setattr(mod, "_DOCTRINE_PATH", doctrine)
        sm._doctrine_hash_cache = None
        result = sm._get_doctrine_hash()
        expected = hashlib.sha256(b"test doctrine content").hexdigest()
        assert result == expected

    def test_doctrine_hash_cached(self, sm):
        sm._doctrine_hash_cache = "cached_value"
        assert sm._get_doctrine_hash() == "cached_value"

    def test_doctrine_hash_empty_string_when_file_missing(self, sm, monkeypatch):
        import swarmz_runtime.governance.seal_matrix as mod
        monkeypatch.setattr(mod, "_DOCTRINE_PATH", Path("/nonexistent/file.md"))
        sm._doctrine_hash_cache = None
        result = sm._get_doctrine_hash()
        assert result == ""


# ── Status and pending ────────────────────────────────────────────────────────


class TestStatusAndPending:
    def test_status_returns_all_actions(self, sm):
        status = sm.status()
        assert "/v1/kernel/shift" in status
        assert "/v1/legacy/seal" in status
        assert "/v1/genome/import" in status

    def test_status_seal_levels_are_strings(self, sm):
        for level in sm.status().values():
            assert isinstance(level, str)

    def test_pending_empty_initially(self, sm):
        assert sm.pending() == {}

    def test_pending_shows_after_first_dual(self, sm):
        sm.approve("/v1/kernel/rollback", _OP_KEY)
        pending = sm.pending()
        assert "/v1/kernel/rollback" in pending

    def test_pending_cleared_after_second_dual(self, sm):
        sm.approve("/v1/kernel/rollback", _OP_KEY)
        sm.approve("/v1/kernel/rollback", _OP_KEY)
        assert sm.pending() == {}


# ── Singleton ─────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.governance.seal_matrix as mod
        monkeypatch.setattr(mod, "_SEAL_MATRIX", None)
        a = get_seal_matrix()
        b = get_seal_matrix()
        assert a is b
        monkeypatch.setattr(mod, "_SEAL_MATRIX", None)

    def test_returns_seal_matrix_instance(self, monkeypatch):
        import swarmz_runtime.governance.seal_matrix as mod
        monkeypatch.setattr(mod, "_SEAL_MATRIX", None)
        instance = get_seal_matrix()
        assert isinstance(instance, SealMatrix)
        monkeypatch.setattr(mod, "_SEAL_MATRIX", None)
