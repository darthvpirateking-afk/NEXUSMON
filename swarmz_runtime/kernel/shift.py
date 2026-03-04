"""NEXUSMON Kernel Shift — runtime bridge reconfiguration layer.

Shifts override the default fallback chain from runtime.json.
All operations are additive — nothing is ever deleted.
Rollback re-applies a previous config as a new shift entry.
"""
from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_ARTIFACTS_DIR = Path("artifacts/kernel")
_SHIFTS_FILE = Path("artifacts/kernel/shifts.jsonl")
_LOCK = threading.Lock()
_KERNEL_SHIFT: "KernelShift | None" = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ShiftConfig:
    primary_tier: str = "cortex"
    fallback_chain: list = field(default_factory=list)
    latency_target_ms: float | None = None
    budget_override: dict = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "primary_tier": self.primary_tier,
            "fallback_chain": list(self.fallback_chain),
            "latency_target_ms": self.latency_target_ms,
            "budget_override": dict(self.budget_override),
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ShiftConfig":
        return cls(
            primary_tier=str(d.get("primary_tier", "cortex")),
            fallback_chain=list(d.get("fallback_chain", [])),
            latency_target_ms=d.get("latency_target_ms"),
            budget_override=dict(d.get("budget_override", {})),
        )


class KernelShift:
    """Runtime bridge reconfiguration — additive layer stack."""

    def __init__(self, shifts_file: Path = _SHIFTS_FILE) -> None:
        self._shifts_file = shifts_file

    def _validate_key(self, operator_key: str) -> None:
        from swarmz_runtime.shadow.executor import validate_operator_key
        validate_operator_key(operator_key)

    def _read_entries(self) -> list[dict[str, Any]]:
        """Read all raw JSONL entries."""
        if not self._shifts_file.exists():
            return []
        entries = []
        for line in self._shifts_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries

    def _append_entry(self, entry: dict[str, Any]) -> None:
        """Write a new entry to the JSONL file (additive only)."""
        self._shifts_file.parent.mkdir(parents=True, exist_ok=True)
        with self._shifts_file.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")

    def shift(self, config: ShiftConfig, operator_key: str) -> ShiftConfig:
        """Apply a kernel shift. Validates operator key and persists."""
        self._validate_key(operator_key)
        entry = {
            "type": "shift",
            "timestamp": _now_iso(),
            **config.to_dict(),
        }
        self._append_entry(entry)
        return config

    def rollback(self, n: int, operator_key: str) -> dict[str, Any]:
        """Roll back n shifts: re-applies the config from n positions ago as a new shift.

        Additive only — nothing is deleted. The old config is re-appended as a new entry.
        Returns the effective config after rollback.
        """
        self._validate_key(operator_key)
        shift_entries = [e for e in self._read_entries() if e.get("type") == "shift"]
        if n <= 0 or n > len(shift_entries):
            raise ValueError(
                f"rollback({n}) out of range — only {len(shift_entries)} shift(s) available"
            )
        target_entry = shift_entries[-n]
        target_config = ShiftConfig.from_dict(target_entry)
        # Log the rollback event (audit only)
        rollback_event = {
            "type": "rollback",
            "timestamp": _now_iso(),
            "rollback_n": n,
            "restored_from": target_entry.get("timestamp", ""),
        }
        self._append_entry(rollback_event)
        # Re-apply the target config as a fresh shift (additive)
        self.shift(target_config, operator_key)
        return self.active_config()

    def active_config(self) -> dict[str, Any]:
        """Return effective config by merging all shift layers (last wins)."""
        shift_entries = [e for e in self._read_entries() if e.get("type") == "shift"]
        merged: dict[str, Any] = {}
        for entry in shift_entries:
            cfg = ShiftConfig.from_dict(entry)
            if cfg.primary_tier:
                merged["primary_tier"] = cfg.primary_tier
            if cfg.fallback_chain:
                merged["fallback_chain"] = cfg.fallback_chain
            if cfg.latency_target_ms is not None:
                merged["latency_target_ms"] = cfg.latency_target_ms
            if cfg.budget_override:
                merged.setdefault("budget_override", {})
                merged["budget_override"].update(cfg.budget_override)
        return merged

    def shift_history(self) -> list[dict[str, Any]]:
        """Return all shift entries in chronological order."""
        return [e for e in self._read_entries() if e.get("type") == "shift"]


def get_kernel_shift() -> KernelShift:
    """Return the global KernelShift singleton."""
    global _KERNEL_SHIFT
    if _KERNEL_SHIFT is None:
        with _LOCK:
            if _KERNEL_SHIFT is None:
                _KERNEL_SHIFT = KernelShift()
    return _KERNEL_SHIFT
