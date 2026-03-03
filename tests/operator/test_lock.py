"""Tests for OperatorLock — one operator, permanent binding, silence on wrong key."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from swarmz_runtime.operator.lock import OperatorLock, get_operator_lock


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def lock(tmp_path):
    """Fresh OperatorLock with binding_path redirected to tmp_path."""
    import swarmz_runtime.operator.lock as mod
    return OperatorLock(binding_path=tmp_path / "operator" / "binding.json")


# ── Unbound behaviour ─────────────────────────────────────────────────────────


class TestUnbound:
    def test_unbound_accepts_first_introduce(self, lock):
        """Unbound system: any key (or no key) passes through."""
        assert lock.check("any_key") is True

    def test_unbound_accepts_no_key(self, lock):
        assert lock.check(None) is True

    def test_unbound_accepts_empty_key(self, lock):
        assert lock.check("") is True

    def test_unbound_status_returns_not_bound(self, lock):
        status = lock.status()
        assert status == {"bound": False}

    def test_is_bound_false_when_no_binding(self, lock):
        assert lock.is_bound() is False


# ── Binding ───────────────────────────────────────────────────────────────────


class TestBind:
    def test_bind_writes_binding_json(self, lock, tmp_path):
        lock.bind("Regan", "key_alpha")
        path = tmp_path / "operator" / "binding.json"
        assert path.exists()

    def test_bind_stores_operator_name(self, lock):
        lock.bind("Regan", "key_alpha")
        assert lock.status()["operator"] == "Regan"

    def test_bind_stores_since_timestamp(self, lock):
        lock.bind("Regan", "key_alpha")
        assert "since" in lock.status()

    def test_bind_marks_as_bound(self, lock):
        lock.bind("Regan", "key_alpha")
        assert lock.is_bound() is True

    def test_bind_does_not_store_key_plaintext(self, lock, tmp_path):
        lock.bind("Regan", "secret_key_999")
        raw = (tmp_path / "operator" / "binding.json").read_text()
        assert "secret_key_999" not in raw

    def test_bind_stores_hashed_key(self, lock, tmp_path):
        import hashlib
        lock.bind("Regan", "my_key")
        data = json.loads((tmp_path / "operator" / "binding.json").read_text())
        expected_hash = hashlib.sha256(b"my_key").hexdigest()
        assert data["operator_key_hash"] == expected_hash


# ── Permanent binding (additive, never overwrites) ────────────────────────────


class TestBindingIsPermanent:
    def test_binding_is_permanent_and_additive(self, lock):
        """Second bind call does NOT overwrite the first binding."""
        result1 = lock.bind("Regan", "key1")
        result2 = lock.bind("Harris", "key2")
        # Same binding returned — first one wins
        assert result1["operator_name"] == result2["operator_name"]
        assert result1["operator_key_hash"] == result2["operator_key_hash"]

    def test_second_bind_does_not_change_key(self, lock):
        lock.bind("Regan", "key1")
        lock.bind("Regan", "key2")
        assert lock.check("key1") is True
        assert lock.check("key2") is False

    def test_bind_reloads_from_disk(self, tmp_path):
        """Two separate OperatorLock instances share the same binding."""
        path = tmp_path / "binding.json"
        lock_a = OperatorLock(binding_path=path)
        lock_a.bind("Regan", "disk_key")
        lock_b = OperatorLock(binding_path=path)
        assert lock_b.is_bound() is True
        assert lock_b.check("disk_key") is True


# ── Bound key checking ────────────────────────────────────────────────────────


class TestBoundRejectsWrongKey:
    def test_bound_rejects_wrong_key_with_silence(self, lock):
        """Wrong key → False (caller returns HTTP 204 silence)."""
        lock.bind("Regan", "correct_key")
        assert lock.check("wrong_key") is False

    def test_bound_rejects_empty_key(self, lock):
        lock.bind("Regan", "correct_key")
        assert lock.check("") is False

    def test_bound_rejects_none_key(self, lock):
        lock.bind("Regan", "correct_key")
        assert lock.check(None) is False

    def test_bound_accepts_correct_key(self, lock):
        lock.bind("Regan", "correct_key")
        assert lock.check("correct_key") is True

    def test_bound_key_check_is_case_sensitive(self, lock):
        lock.bind("Regan", "MyKey")
        assert lock.check("mykey") is False
        assert lock.check("MYKEY") is False
        assert lock.check("MyKey") is True


# ── Status endpoint (always accessible) ──────────────────────────────────────


class TestLockStatus:
    def test_lock_status_works_without_key_unbound(self, lock):
        status = lock.status()
        assert "bound" in status
        assert status["bound"] is False

    def test_lock_status_works_without_key_bound(self, lock):
        lock.bind("Regan", "any_key")
        status = lock.status()
        assert status["bound"] is True
        assert status["operator"] == "Regan"

    def test_lock_status_has_since_when_bound(self, lock):
        lock.bind("Regan", "any_key")
        status = lock.status()
        assert "since" in status
        assert status["since"] != ""


# ── Singleton ─────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.operator.lock as mod
        monkeypatch.setattr(mod, "_OPERATOR_LOCK", None)
        a = get_operator_lock()
        b = get_operator_lock()
        assert a is b
        monkeypatch.setattr(mod, "_OPERATOR_LOCK", None)

    def test_returns_operator_lock_instance(self, monkeypatch):
        import swarmz_runtime.operator.lock as mod
        monkeypatch.setattr(mod, "_OPERATOR_LOCK", None)
        instance = get_operator_lock()
        assert isinstance(instance, OperatorLock)
        monkeypatch.setattr(mod, "_OPERATOR_LOCK", None)
