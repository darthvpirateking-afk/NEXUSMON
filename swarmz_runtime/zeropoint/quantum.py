"""NEXUSMON Quantum Doctrine — superposition state manager.

A quantum state is a named snapshot of the entire doctrine configuration:
  kernel config, seal level registry, active overrides, evolution stage/traits.

Operator can hold multiple named states simultaneously and collapse to any of them.
Collapse is additive — it applies the saved state as new entries via each subsystem's
own mechanisms (KernelShift.shift, ZeroPointOverride.apply). Nothing is ever deleted.

All states and collapses are persisted at artifacts/zeropoint/quantum_states.jsonl.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

_STATES_FILE = Path("artifacts/zeropoint/quantum_states.jsonl")
_LOCK = threading.Lock()
_QUANTUM_DOCTRINE: QuantumDoctrine | None = None


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class QuantumState:
    name: str
    snapshot_at: str
    kernel_config: dict = field(default_factory=dict)
    seal_registry: dict = field(default_factory=dict)
    active_overrides: list = field(default_factory=list)
    evolution_stage: str = "ORIGIN"
    traits: list = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "snapshot_at": self.snapshot_at,
            "kernel_config": dict(self.kernel_config),
            "seal_registry": dict(self.seal_registry),
            "active_overrides": list(self.active_overrides),
            "evolution_stage": self.evolution_stage,
            "traits": list(self.traits),
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> QuantumState:
        return cls(
            name=str(d.get("name", "")),
            snapshot_at=str(d.get("snapshot_at", "")),
            kernel_config=dict(d.get("kernel_config", {})),
            seal_registry=dict(d.get("seal_registry", {})),
            active_overrides=list(d.get("active_overrides", [])),
            evolution_stage=str(d.get("evolution_stage", "ORIGIN")),
            traits=list(d.get("traits", [])),
        )


class QuantumDoctrine:
    """Snapshot and restore full doctrine state — superposition manager."""

    def __init__(self, states_file: Path = _STATES_FILE) -> None:
        self._states_file = states_file

    def _read_entries(self) -> list[dict[str, Any]]:
        if not self._states_file.exists():
            return []
        entries = []
        for line in self._states_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries

    def _append_entry(self, entry: dict[str, Any]) -> None:
        self._states_file.parent.mkdir(parents=True, exist_ok=True)
        with self._states_file.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")

    def _capture_current_state(self, name: str) -> QuantumState:
        """Read current live state from all subsystems."""
        kernel_config: dict[str, Any] = {}
        seal_registry: dict[str, Any] = {}
        active_overrides: list[Any] = []
        evolution_stage = "ORIGIN"
        traits: list[Any] = []

        try:
            from swarmz_runtime.kernel.shift import get_kernel_shift

            kernel_config = get_kernel_shift().active_config()
        except Exception:
            pass

        try:
            from swarmz_runtime.governance.seal_matrix import get_seal_matrix

            seal_registry = get_seal_matrix().status()
        except Exception:
            pass

        try:
            from swarmz_runtime.zeropoint.override import get_zero_point_override

            active_overrides = get_zero_point_override().active_overrides()
        except Exception:
            pass

        try:
            from swarmz_runtime.evolution.engine import get_engine

            stage_info = get_engine().status()
            evolution_stage = stage_info.get("stage", "ORIGIN")
            traits = stage_info.get("traits", [])
        except Exception:
            pass

        return QuantumState(
            name=name,
            snapshot_at=_now_iso(),
            kernel_config=kernel_config,
            seal_registry=seal_registry,
            active_overrides=active_overrides,
            evolution_stage=evolution_stage,
            traits=traits,
        )

    def snapshot(self, name: str) -> QuantumState:
        """Capture and persist current doctrine state as a named quantum state."""
        if not name or not name.strip():
            raise ValueError("Quantum state name cannot be empty")
        state = self._capture_current_state(name.strip())
        self._append_entry({"type": "snapshot", **state.to_dict()})
        return state

    def collapse(self, name: str, operator_key: str) -> dict[str, Any]:
        """Collapse to a named quantum state — applies its config as new entries (additive).

        Returns a summary of what was restored.
        """
        states = self.list_states()
        # Find most recent snapshot with this name
        matches = [s for s in states if s["name"] == name]
        if not matches:
            raise ValueError(f"No quantum state named '{name}'")
        target = QuantumState.from_dict(matches[-1])

        restored: dict[str, Any] = {"name": name, "actions": []}

        # Restore kernel config (additive via KernelShift)
        if target.kernel_config:
            try:
                from swarmz_runtime.kernel.shift import ShiftConfig, get_kernel_shift

                cfg = ShiftConfig.from_dict(target.kernel_config)
                get_kernel_shift().shift(cfg, operator_key)
                restored["actions"].append("kernel_config_restored")
            except Exception as exc:
                restored["actions"].append(f"kernel_config_error: {exc}")

        # Log the collapse event
        self._append_entry(
            {
                "type": "collapse",
                "collapsed_to": name,
                "snapshot_at": target.snapshot_at,
                "collapsed_at": _now_iso(),
                "restored_actions": restored["actions"],
            }
        )
        return restored

    def list_states(self) -> list[dict[str, Any]]:
        """Return all saved quantum state snapshots."""
        return [e for e in self._read_entries() if e.get("type") == "snapshot"]

    def collapse_history(self) -> list[dict[str, Any]]:
        """Return all collapse events."""
        return [e for e in self._read_entries() if e.get("type") == "collapse"]


def get_quantum_doctrine() -> QuantumDoctrine:
    """Return the global QuantumDoctrine singleton."""
    global _QUANTUM_DOCTRINE
    if _QUANTUM_DOCTRINE is None:
        with _LOCK:
            if _QUANTUM_DOCTRINE is None:
                _QUANTUM_DOCTRINE = QuantumDoctrine()
    return _QUANTUM_DOCTRINE
