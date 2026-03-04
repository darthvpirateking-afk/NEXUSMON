"""Tests for KernelShift — shift, rollback, active_config, history, config.py integration."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from swarmz_runtime.kernel.shift import (
    KernelShift,
    ShiftConfig,
    get_kernel_shift,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


# Use the valid operator key
_OP_KEY = "swarmz_sovereign_key"
_BAD_KEY = "wrong_key"


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def ks(tmp_path, monkeypatch):
    """Fresh KernelShift with artifacts redirected to tmp_path."""
    import swarmz_runtime.kernel.shift as mod
    monkeypatch.setattr(mod, "_KERNEL_SHIFT", None)
    shifts_file = tmp_path / "kernel" / "shifts.jsonl"
    return KernelShift(shifts_file=shifts_file)


# ── ShiftConfig model ─────────────────────────────────────────────────────────


class TestShiftConfigModel:
    def test_to_dict_keys(self):
        cfg = ShiftConfig(primary_tier="reflex", fallback_chain=[{"tier": "cortex"}],
                          latency_target_ms=100.0, budget_override={"per_call": 512})
        d = cfg.to_dict()
        assert set(d.keys()) == {"primary_tier", "fallback_chain", "latency_target_ms", "budget_override"}

    def test_from_dict_roundtrip(self):
        original = ShiftConfig(primary_tier="reflex", fallback_chain=[{"tier": "cortex"}],
                               latency_target_ms=50.0, budget_override={"k": 1})
        restored = ShiftConfig.from_dict(original.to_dict())
        assert restored.primary_tier == original.primary_tier
        assert restored.fallback_chain == original.fallback_chain
        assert restored.latency_target_ms == original.latency_target_ms

    def test_from_dict_defaults(self):
        cfg = ShiftConfig.from_dict({})
        assert cfg.primary_tier == "cortex"
        assert cfg.fallback_chain == []
        assert cfg.latency_target_ms is None
        assert cfg.budget_override == {}


# ── Shift ─────────────────────────────────────────────────────────────────────


class TestShift:
    def test_shift_persists_to_disk(self, ks):
        cfg = ShiftConfig(primary_tier="reflex")
        ks.shift(cfg, _OP_KEY)
        assert ks._shifts_file.exists()

    def test_shift_returns_config(self, ks):
        cfg = ShiftConfig(primary_tier="reflex")
        result = ks.shift(cfg, _OP_KEY)
        assert result.primary_tier == "reflex"

    def test_shift_invalid_key_raises(self, ks):
        cfg = ShiftConfig(primary_tier="reflex")
        with pytest.raises(Exception):
            ks.shift(cfg, _BAD_KEY)

    def test_shift_appends_not_overwrites(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        history = ks.shift_history()
        assert len(history) == 2

    def test_shift_multiple_tiers(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="fallback"), _OP_KEY)
        assert len(ks.shift_history()) == 3


# ── Active config ─────────────────────────────────────────────────────────────


class TestActiveConfig:
    def test_empty_when_no_shifts(self, ks):
        cfg = ks.active_config()
        assert cfg == {}

    def test_active_config_reflects_last_shift(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        cfg = ks.active_config()
        assert cfg["primary_tier"] == "cortex"

    def test_active_config_merges_layers(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex", latency_target_ms=50.0), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        cfg = ks.active_config()
        # latency from layer 1, primary_tier from layer 2
        assert cfg["primary_tier"] == "cortex"
        assert cfg["latency_target_ms"] == 50.0

    def test_active_config_fallback_chain_present(self, ks):
        chain = [{"provider": "openai", "model": "gpt-4o", "tier": "cortex"}]
        ks.shift(ShiftConfig(primary_tier="cortex", fallback_chain=chain), _OP_KEY)
        cfg = ks.active_config()
        assert cfg["fallback_chain"] == chain

    def test_budget_override_merged(self, ks):
        ks.shift(ShiftConfig(budget_override={"per_call": 512}), _OP_KEY)
        ks.shift(ShiftConfig(budget_override={"per_agent": 1000}), _OP_KEY)
        cfg = ks.active_config()
        assert cfg["budget_override"]["per_call"] == 512
        assert cfg["budget_override"]["per_agent"] == 1000


# ── History ───────────────────────────────────────────────────────────────────


class TestShiftHistory:
    def test_history_empty_when_no_shifts(self, ks):
        assert ks.shift_history() == []

    def test_history_records_all_shifts(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        history = ks.shift_history()
        assert len(history) == 2

    def test_history_entries_have_type_shift(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        history = ks.shift_history()
        assert history[0]["type"] == "shift"

    def test_history_entries_have_timestamp(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        history = ks.shift_history()
        assert "timestamp" in history[0]


# ── Rollback ──────────────────────────────────────────────────────────────────


class TestRollback:
    def test_rollback_re_applies_previous_config(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex", latency_target_ms=50.0), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex", latency_target_ms=200.0), _OP_KEY)
        ks.rollback(1, _OP_KEY)
        cfg = ks.active_config()
        # After rollback(1), last entry is the re-applied second shift (cortex)
        assert cfg["primary_tier"] == "cortex"

    def test_rollback_2_re_applies_first_config(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex", latency_target_ms=50.0), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        ks.rollback(2, _OP_KEY)
        # rollback(2) re-applies the 2nd-from-last = first shift (reflex)
        cfg = ks.active_config()
        assert cfg["primary_tier"] == "reflex"

    def test_rollback_is_additive(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        ks.shift(ShiftConfig(primary_tier="cortex"), _OP_KEY)
        ks.rollback(1, _OP_KEY)
        # After rollback: original 2 shifts + 1 rollback event + 1 re-applied shift = 3 total shifts
        assert len(ks.shift_history()) == 3

    def test_rollback_invalid_key_raises(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        with pytest.raises(Exception):
            ks.rollback(1, _BAD_KEY)

    def test_rollback_out_of_range_raises(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        with pytest.raises(ValueError):
            ks.rollback(5, _OP_KEY)

    def test_rollback_zero_raises(self, ks):
        ks.shift(ShiftConfig(primary_tier="reflex"), _OP_KEY)
        with pytest.raises(ValueError):
            ks.rollback(0, _OP_KEY)


# ── config.py integration ─────────────────────────────────────────────────────


class TestConfigIntegration:
    def test_get_fallback_chain_uses_kernel_shift_when_set(self, ks, monkeypatch):
        import swarmz_runtime.kernel.shift as mod
        monkeypatch.setattr(mod, "_KERNEL_SHIFT", ks)
        chain = [{"provider": "openai", "model": "gpt-4o", "tier": "cortex"}]
        ks.shift(ShiftConfig(primary_tier="cortex", fallback_chain=chain), _OP_KEY)
        from swarmz_runtime.bridge.config import get_fallback_chain, reset_cache
        reset_cache()
        result = get_fallback_chain("cortex")
        assert result == chain

    def test_get_fallback_chain_falls_through_when_no_kernel_shift(self, ks, monkeypatch):
        import swarmz_runtime.kernel.shift as mod
        monkeypatch.setattr(mod, "_KERNEL_SHIFT", ks)
        # No shifts applied — should fall through to normal tier chain
        from swarmz_runtime.bridge.config import get_fallback_chain, reset_cache
        reset_cache()
        result = get_fallback_chain("cortex")
        # Normal chain returns tier-based entries with provider/model
        assert isinstance(result, list)
        assert len(result) > 0
        assert "provider" in result[0] or "tier" in result[0]


# ── Singleton ─────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.kernel.shift as mod
        monkeypatch.setattr(mod, "_KERNEL_SHIFT", None)
        a = get_kernel_shift()
        b = get_kernel_shift()
        assert a is b
        monkeypatch.setattr(mod, "_KERNEL_SHIFT", None)

    def test_returns_kernel_shift_instance(self, monkeypatch):
        import swarmz_runtime.kernel.shift as mod
        monkeypatch.setattr(mod, "_KERNEL_SHIFT", None)
        instance = get_kernel_shift()
        assert isinstance(instance, KernelShift)
        monkeypatch.setattr(mod, "_KERNEL_SHIFT", None)
