"""Tests for ZeroPointOverride — SOVEREIGN-gated system override layer."""
from __future__ import annotations

import pytest

from swarmz_runtime.zeropoint.override import Override, ZeroPointOverride, get_zero_point_override

_OP_KEY = "swarmz_sovereign_key"
_BAD_KEY = "wrong_key"
_VALID_SUBSYSTEMS = ["bridge", "cost", "combat", "seal"]


# ── Fixtures ───────────────────────────────────────────────────────────────────


@pytest.fixture()
def zpo(tmp_path, monkeypatch):
    """Fresh ZeroPointOverride backed by a temp JSONL file."""
    import swarmz_runtime.zeropoint.override as mod
    monkeypatch.setattr(mod, "_ZERO_POINT_OVERRIDE", None)
    overrides_file = tmp_path / "overrides.jsonl"
    return ZeroPointOverride(overrides_file=overrides_file)


@pytest.fixture()
def sovereign_hash(monkeypatch):
    """Patch SealMatrix to treat any hash as valid for SOVEREIGN."""
    from swarmz_runtime.governance.seal_matrix import ApprovalResult
    monkeypatch.setattr(
        "swarmz_runtime.zeropoint.override.ZeroPointOverride._validate_sovereign",
        lambda self, key, doctrine_hash: None,
    )


# ── Override dataclass ─────────────────────────────────────────────────────────


class TestOverrideModel:
    def test_to_dict_keys(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        o = Override(
            override_id="abc123",
            subsystem="bridge",
            parameter="primary_tier",
            value="reflex",
            ttl_seconds=60,
            applied_at=now.isoformat(),
            expires_at=(now + timedelta(seconds=60)).isoformat(),
        )
        d = o.to_dict()
        assert set(d.keys()) == {
            "override_id", "subsystem", "parameter", "value",
            "ttl_seconds", "applied_at", "expires_at", "active",
        }

    def test_from_dict_roundtrip(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        d = {
            "override_id": "xyz",
            "subsystem": "cost",
            "parameter": "budget_tokens_combat",
            "value": 512,
            "ttl_seconds": 300,
            "applied_at": now.isoformat(),
            "expires_at": (now + timedelta(seconds=300)).isoformat(),
            "active": True,
        }
        o = Override.from_dict(d)
        assert o.override_id == "xyz"
        assert o.subsystem == "cost"
        assert o.value == 512

    def test_is_expired_past_timestamp(self):
        o = Override(
            override_id="x", subsystem="bridge", parameter="p", value="v",
            ttl_seconds=1,
            applied_at="2020-01-01T00:00:00+00:00",
            expires_at="2020-01-01T00:00:01+00:00",
        )
        assert o.is_expired() is True

    def test_is_not_expired_future_timestamp(self):
        from datetime import datetime, timezone, timedelta
        future = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        o = Override(
            override_id="x", subsystem="bridge", parameter="p", value="v",
            ttl_seconds=3600,
            applied_at=datetime.now(timezone.utc).isoformat(),
            expires_at=future,
        )
        assert o.is_expired() is False


# ── apply ──────────────────────────────────────────────────────────────────────


class TestApply:
    def test_apply_returns_override(self, zpo, sovereign_hash):
        o = zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash", ttl_seconds=60)
        assert isinstance(o, Override)
        assert o.subsystem == "bridge"
        assert o.parameter == "primary_tier"
        assert o.value == "reflex"
        assert o.active is True

    def test_apply_unknown_subsystem_raises(self, zpo, sovereign_hash):
        with pytest.raises(ValueError, match="Unknown subsystem"):
            zpo.apply("unknown", "p", "v", _OP_KEY, "hash")

    def test_apply_persists_to_jsonl(self, zpo, sovereign_hash):
        zpo.apply("cost", "budget_tokens_combat", 512, _OP_KEY, "hash")
        entries = zpo._read_entries()
        assert len(entries) == 1
        assert entries[0]["type"] == "apply"
        assert entries[0]["subsystem"] == "cost"

    def test_apply_generates_unique_ids(self, zpo, sovereign_hash):
        o1 = zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash")
        o2 = zpo.apply("combat", "retry_budget", 3, _OP_KEY, "hash")
        assert o1.override_id != o2.override_id

    def test_apply_all_valid_subsystems(self, zpo, sovereign_hash):
        for sub in _VALID_SUBSYSTEMS:
            o = zpo.apply(sub, "param", "value", _OP_KEY, "hash", ttl_seconds=60)
            assert o.subsystem == sub

    def test_apply_requires_sovereign_key(self, zpo):
        with pytest.raises(Exception):
            zpo.apply("bridge", "p", "v", _BAD_KEY, "bad_hash")


# ── expire ─────────────────────────────────────────────────────────────────────


class TestExpire:
    def test_expire_returns_true_for_known_id(self, zpo, sovereign_hash):
        o = zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash")
        assert zpo.expire(o.override_id) is True

    def test_expire_returns_false_for_unknown_id(self, zpo):
        assert zpo.expire("nonexistent") is False

    def test_expired_override_not_in_active(self, zpo, sovereign_hash):
        o = zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash", ttl_seconds=9999)
        zpo.expire(o.override_id)
        active = zpo.active_overrides()
        assert not any(x["override_id"] == o.override_id for x in active)

    def test_expire_logs_entry(self, zpo, sovereign_hash):
        o = zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash")
        zpo.expire(o.override_id)
        entries = zpo._read_entries()
        expire_entries = [e for e in entries if e.get("type") == "expire"]
        assert len(expire_entries) == 1


# ── list and status ────────────────────────────────────────────────────────────


class TestListAndStatus:
    def test_list_empty_initially(self, zpo):
        assert zpo.list_overrides() == []

    def test_list_includes_applied(self, zpo, sovereign_hash):
        zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash")
        assert len(zpo.list_overrides()) == 1

    def test_active_overrides_excludes_expired(self, zpo, sovereign_hash):
        o = zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash", ttl_seconds=9999)
        assert len(zpo.active_overrides()) == 1
        zpo.expire(o.override_id)
        assert len(zpo.active_overrides()) == 0

    def test_status_summary_by_subsystem(self, zpo, sovereign_hash):
        zpo.apply("bridge", "primary_tier", "reflex", _OP_KEY, "hash", ttl_seconds=9999)
        zpo.apply("cost", "budget_tokens_combat", 512, _OP_KEY, "hash", ttl_seconds=9999)
        summary = zpo.status_summary()
        assert summary["total_active"] == 2
        assert "bridge" in summary["by_subsystem"]
        assert "cost" in summary["by_subsystem"]

    def test_status_summary_empty(self, zpo):
        summary = zpo.status_summary()
        assert summary["total_active"] == 0


# ── Singleton ──────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.zeropoint.override as mod
        monkeypatch.setattr(mod, "_ZERO_POINT_OVERRIDE", None)
        a = get_zero_point_override()
        b = get_zero_point_override()
        assert a is b
        monkeypatch.setattr(mod, "_ZERO_POINT_OVERRIDE", None)

    def test_returns_correct_type(self, monkeypatch):
        import swarmz_runtime.zeropoint.override as mod
        monkeypatch.setattr(mod, "_ZERO_POINT_OVERRIDE", None)
        assert isinstance(get_zero_point_override(), ZeroPointOverride)
        monkeypatch.setattr(mod, "_ZERO_POINT_OVERRIDE", None)
