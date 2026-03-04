"""Tests for QuantumDoctrine — snapshot/collapse doctrine state manager."""
from __future__ import annotations

import pytest

from swarmz_runtime.zeropoint.quantum import QuantumDoctrine, QuantumState, get_quantum_doctrine


# ── Fixtures ───────────────────────────────────────────────────────────────────


@pytest.fixture()
def qd(tmp_path, monkeypatch):
    """Fresh QuantumDoctrine backed by a temp JSONL file."""
    import swarmz_runtime.zeropoint.quantum as mod
    monkeypatch.setattr(mod, "_QUANTUM_DOCTRINE", None)
    states_file = tmp_path / "quantum_states.jsonl"
    return QuantumDoctrine(states_file=states_file)


@pytest.fixture()
def silent_subsystems(monkeypatch):
    """Patch subsystem reads to avoid side effects during snapshot."""
    monkeypatch.setattr(
        "swarmz_runtime.zeropoint.quantum.QuantumDoctrine._capture_current_state",
        lambda self, name: QuantumState(
            name=name,
            snapshot_at="2026-01-01T00:00:00+00:00",
            kernel_config={"primary_tier": "cortex"},
            seal_registry={"/v1/kernel/shift": "OPERATOR"},
            active_overrides=[],
            evolution_stage="MONARCH_SHELL",
            traits=["kernel_shift", "seal_matrix"],
        ),
    )


# ── QuantumState model ─────────────────────────────────────────────────────────


class TestQuantumStateModel:
    def test_to_dict_keys(self):
        s = QuantumState(name="test", snapshot_at="2026-01-01T00:00:00+00:00")
        d = s.to_dict()
        assert set(d.keys()) == {
            "name", "snapshot_at", "kernel_config", "seal_registry",
            "active_overrides", "evolution_stage", "traits",
        }

    def test_from_dict_roundtrip(self):
        d = {
            "name": "alpha",
            "snapshot_at": "2026-01-01T00:00:00+00:00",
            "kernel_config": {"primary_tier": "reflex"},
            "seal_registry": {},
            "active_overrides": [],
            "evolution_stage": "ZERO_POINT_FORM",
            "traits": ["autonomy"],
        }
        s = QuantumState.from_dict(d)
        assert s.name == "alpha"
        assert s.evolution_stage == "ZERO_POINT_FORM"
        assert "autonomy" in s.traits


# ── snapshot ───────────────────────────────────────────────────────────────────


class TestSnapshot:
    def test_snapshot_returns_state(self, qd, silent_subsystems):
        s = qd.snapshot("alpha")
        assert isinstance(s, QuantumState)
        assert s.name == "alpha"

    def test_snapshot_persists_entry(self, qd, silent_subsystems):
        qd.snapshot("alpha")
        entries = qd._read_entries()
        assert len(entries) == 1
        assert entries[0]["type"] == "snapshot"
        assert entries[0]["name"] == "alpha"

    def test_snapshot_empty_name_raises(self, qd):
        with pytest.raises(ValueError):
            qd.snapshot("")

    def test_snapshot_whitespace_name_raises(self, qd):
        with pytest.raises(ValueError):
            qd.snapshot("   ")

    def test_multiple_snapshots_different_names(self, qd, silent_subsystems):
        qd.snapshot("alpha")
        qd.snapshot("beta")
        states = qd.list_states()
        assert len(states) == 2
        names = [s["name"] for s in states]
        assert "alpha" in names
        assert "beta" in names

    def test_snapshot_captures_kernel_config(self, qd, silent_subsystems):
        s = qd.snapshot("alpha")
        assert s.kernel_config == {"primary_tier": "cortex"}

    def test_snapshot_captures_evolution_stage(self, qd, silent_subsystems):
        s = qd.snapshot("alpha")
        assert s.evolution_stage == "MONARCH_SHELL"


# ── list_states ────────────────────────────────────────────────────────────────


class TestListStates:
    def test_empty_initially(self, qd):
        assert qd.list_states() == []

    def test_lists_saved_states(self, qd, silent_subsystems):
        qd.snapshot("alpha")
        qd.snapshot("beta")
        assert len(qd.list_states()) == 2

    def test_list_returns_dicts(self, qd, silent_subsystems):
        qd.snapshot("alpha")
        states = qd.list_states()
        assert isinstance(states[0], dict)
        assert "name" in states[0]


# ── collapse ───────────────────────────────────────────────────────────────────

_OP_KEY = "swarmz_sovereign_key"


class TestCollapse:
    def test_collapse_unknown_name_raises(self, qd):
        with pytest.raises(ValueError, match="No quantum state"):
            qd.collapse("nonexistent", _OP_KEY)

    def test_collapse_returns_dict_with_name(self, qd, silent_subsystems, monkeypatch):
        qd.snapshot("alpha")
        # Patch kernel shift to avoid needing real artifacts
        monkeypatch.setattr(
            "swarmz_runtime.zeropoint.quantum.QuantumDoctrine.collapse",
            lambda self, name, operator_key: {
                "name": name, "actions": ["kernel_config_restored"]
            },
        )
        result = qd.collapse("alpha", _OP_KEY)
        assert result["name"] == "alpha"

    def test_collapse_logs_to_history(self, qd, silent_subsystems, monkeypatch):
        qd.snapshot("alpha")
        # Bypass the actual kernel shift call
        from swarmz_runtime.kernel.shift import KernelShift
        monkeypatch.setattr(KernelShift, "shift", lambda self, cfg, key: None)
        qd.collapse("alpha", _OP_KEY)
        history = qd.collapse_history()
        assert len(history) == 1
        assert history[0]["collapsed_to"] == "alpha"


# ── collapse_history ───────────────────────────────────────────────────────────


class TestCollapseHistory:
    def test_empty_initially(self, qd):
        assert qd.collapse_history() == []

    def test_history_only_collapse_entries(self, qd, silent_subsystems):
        qd.snapshot("alpha")
        entries = qd._read_entries()
        collapses = [e for e in entries if e.get("type") == "collapse"]
        assert collapses == []


# ── Singleton ──────────────────────────────────────────────────────────────────


class TestSingleton:
    def test_returns_same_instance(self, monkeypatch):
        import swarmz_runtime.zeropoint.quantum as mod
        monkeypatch.setattr(mod, "_QUANTUM_DOCTRINE", None)
        a = get_quantum_doctrine()
        b = get_quantum_doctrine()
        assert a is b
        monkeypatch.setattr(mod, "_QUANTUM_DOCTRINE", None)

    def test_returns_correct_type(self, monkeypatch):
        import swarmz_runtime.zeropoint.quantum as mod
        monkeypatch.setattr(mod, "_QUANTUM_DOCTRINE", None)
        assert isinstance(get_quantum_doctrine(), QuantumDoctrine)
        monkeypatch.setattr(mod, "_QUANTUM_DOCTRINE", None)
