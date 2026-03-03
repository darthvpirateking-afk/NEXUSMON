"""Tests for nexusmon_artifact_vault — CRUD, versioning, review, history."""
from __future__ import annotations

import importlib
import json
import os
from pathlib import Path

import pytest


# ---------------------------------------------------------------------------
# Fixture: redirect vault storage to a tmp dir so tests don't touch data/
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _isolated_vault(tmp_path, monkeypatch):
    """Override DATABASE_URL so the vault writes to a temp directory."""
    db_path = tmp_path / "test_nexusmon.db"
    monkeypatch.setenv("DATABASE_URL", str(db_path))
    # Re-import the module after patching the env var so _data_dir() picks it up
    import nexusmon_artifact_vault as vault_mod
    importlib.reload(vault_mod)
    yield vault_mod


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _store(vault, **kwargs):
    defaults = dict(
        mission_id="m-test-001",
        task_id="t-001",
        type="LOG",
        title="Test Artifact",
        content={"value": 42},
        input_snapshot={"key": "val"},
    )
    defaults.update(kwargs)
    return vault.store_artifact(**defaults)


# ---------------------------------------------------------------------------
# store_artifact
# ---------------------------------------------------------------------------


class TestStoreArtifact:
    def test_returns_dict_with_required_keys(self, _isolated_vault):
        art = _store(_isolated_vault)
        for key in ("id", "version", "mission_id", "task_id", "type", "title",
                    "content", "status", "created_at"):
            assert key in art, f"Missing key: {key}"

    def test_initial_status_is_pending_review(self, _isolated_vault):
        art = _store(_isolated_vault)
        assert art["status"] == "PENDING_REVIEW"

    def test_initial_version_is_1(self, _isolated_vault):
        art = _store(_isolated_vault)
        assert art["version"] == 1

    def test_unknown_type_falls_back_to_log(self, _isolated_vault):
        art = _store(_isolated_vault, type="BOGUS")
        assert art["type"] == "LOG"

    def test_valid_types_are_stored_as_upper(self, _isolated_vault):
        for t in ("TEXT", "CODE", "DATA", "REPORT", "ANALYSIS", "DECISION"):
            art = _store(_isolated_vault, title=f"art-{t}", type=t)
            assert art["type"] == t


# ---------------------------------------------------------------------------
# Versioning
# ---------------------------------------------------------------------------


class TestVersioning:
    def test_same_title_same_mission_increments_version(self, _isolated_vault):
        a1 = _store(_isolated_vault, title="versioned-art")
        a2 = _store(_isolated_vault, title="versioned-art")
        assert a1["version"] == 1
        assert a2["version"] == 2

    def test_different_title_starts_at_v1(self, _isolated_vault):
        _store(_isolated_vault, title="art-a")
        a2 = _store(_isolated_vault, title="art-b")
        assert a2["version"] == 1

    def test_different_mission_starts_at_v1(self, _isolated_vault):
        _store(_isolated_vault, mission_id="m-001", title="shared-title")
        a2 = _store(_isolated_vault, mission_id="m-002", title="shared-title")
        assert a2["version"] == 1

    def test_previous_version_id_links_chain(self, _isolated_vault):
        a1 = _store(_isolated_vault, title="chain-art")
        a2 = _store(_isolated_vault, title="chain-art")
        assert a2["previous_version_id"] == a1["id"]


# ---------------------------------------------------------------------------
# get_artifact
# ---------------------------------------------------------------------------


class TestGetArtifact:
    def test_returns_stored_artifact_by_id(self, _isolated_vault):
        art = _store(_isolated_vault)
        fetched = _isolated_vault.get_artifact(art["id"])
        assert fetched is not None
        assert fetched["id"] == art["id"]

    def test_returns_none_for_unknown_id(self, _isolated_vault):
        result = _isolated_vault.get_artifact("does-not-exist")
        assert result is None


# ---------------------------------------------------------------------------
# list_artifacts
# ---------------------------------------------------------------------------


class TestListArtifacts:
    def test_returns_all_when_no_filter(self, _isolated_vault):
        _store(_isolated_vault, title="a1")
        _store(_isolated_vault, title="a2")
        arts = _isolated_vault.list_artifacts()
        assert len(arts) == 2

    def test_filter_by_mission_id(self, _isolated_vault):
        _store(_isolated_vault, mission_id="m-A", title="art")
        _store(_isolated_vault, mission_id="m-B", title="art2")
        arts = _isolated_vault.list_artifacts(mission_id="m-A")
        assert len(arts) == 1
        assert arts[0]["mission_id"] == "m-A"

    def test_filter_by_status(self, _isolated_vault):
        art = _store(_isolated_vault, title="pending-art")
        _isolated_vault.approve_artifact(art["id"])
        _store(_isolated_vault, title="still-pending")
        pending = _isolated_vault.list_artifacts(status="PENDING_REVIEW")
        approved = _isolated_vault.list_artifacts(status="APPROVED")
        assert len(pending) == 1
        assert len(approved) == 1

    def test_filter_by_type(self, _isolated_vault):
        _store(_isolated_vault, title="code-art", type="CODE")
        _store(_isolated_vault, title="log-art", type="LOG")
        arts = _isolated_vault.list_artifacts(type="CODE")
        assert len(arts) == 1
        assert arts[0]["type"] == "CODE"

    def test_limit_is_respected(self, _isolated_vault):
        for i in range(10):
            _store(_isolated_vault, title=f"art-{i}")
        arts = _isolated_vault.list_artifacts(limit=5)
        assert len(arts) == 5


# ---------------------------------------------------------------------------
# approve / reject
# ---------------------------------------------------------------------------


class TestReview:
    def test_approve_sets_status(self, _isolated_vault):
        art = _store(_isolated_vault)
        updated = _isolated_vault.approve_artifact(art["id"])
        assert updated["status"] == "APPROVED"
        assert updated["reviewed_by"] == "operator"
        assert updated["reviewed_at"] != ""

    def test_approve_stores_notes(self, _isolated_vault):
        art = _store(_isolated_vault)
        updated = _isolated_vault.approve_artifact(art["id"], notes="LGTM")
        assert updated["operator_notes"] == "LGTM"

    def test_reject_sets_status(self, _isolated_vault):
        art = _store(_isolated_vault)
        updated = _isolated_vault.reject_artifact(art["id"])
        assert updated["status"] == "REJECTED"

    def test_reject_stores_notes(self, _isolated_vault):
        art = _store(_isolated_vault)
        updated = _isolated_vault.reject_artifact(art["id"], notes="needs work")
        assert updated["operator_notes"] == "needs work"

    def test_approve_unknown_raises_value_error(self, _isolated_vault):
        with pytest.raises(ValueError):
            _isolated_vault.approve_artifact("no-such-id")

    def test_reject_unknown_raises_value_error(self, _isolated_vault):
        with pytest.raises(ValueError):
            _isolated_vault.reject_artifact("no-such-id")

    def test_approve_persists_across_list(self, _isolated_vault):
        art = _store(_isolated_vault)
        _isolated_vault.approve_artifact(art["id"])
        arts = _isolated_vault.list_artifacts(status="APPROVED")
        assert any(a["id"] == art["id"] for a in arts)


# ---------------------------------------------------------------------------
# get_artifact_history
# ---------------------------------------------------------------------------


class TestHistory:
    def test_history_returns_all_versions(self, _isolated_vault):
        _store(_isolated_vault, title="hist-art")
        _store(_isolated_vault, title="hist-art")
        _store(_isolated_vault, title="hist-art")
        # get the latest to use as anchor
        arts = _isolated_vault.list_artifacts()
        hist = _isolated_vault.get_artifact_history(arts[-1]["id"])
        assert len(hist) == 3

    def test_history_empty_for_unknown_id(self, _isolated_vault):
        hist = _isolated_vault.get_artifact_history("ghost-id")
        assert hist == []

    def test_history_ordered_oldest_first(self, _isolated_vault):
        a1 = _store(_isolated_vault, title="ordered-art")
        a2 = _store(_isolated_vault, title="ordered-art")
        hist = _isolated_vault.get_artifact_history(a2["id"])
        assert hist[0]["id"] == a1["id"]
        assert hist[1]["id"] == a2["id"]
