"""NEXUSMON ZeroPoint Override — runtime subsystem override layer.

Overrides suppress the default behaviour of any subsystem for a finite TTL.
All overrides are additive — each override is a new JSONL entry, never deleted.
Requires SOVEREIGN seal level: valid operator key + doctrine hash.

Supported subsystems and parameters:
  bridge      primary_tier, fallback_chain
  cost        budget_tokens_{mode} (e.g. budget_tokens_combat)
  combat      retry_budget, latency_target_ms
  seal        seal_level_{action} (elevate a resource's required seal level)
"""
from __future__ import annotations

import json
import secrets
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_ARTIFACTS_DIR = Path("artifacts/zeropoint")
_OVERRIDES_FILE = Path("artifacts/zeropoint/overrides.jsonl")
_LOCK = threading.Lock()
_ZERO_POINT_OVERRIDE: "ZeroPointOverride | None" = None

_DEFAULT_TTL = 3600  # seconds


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


@dataclass
class Override:
    override_id: str
    subsystem: str
    parameter: str
    value: Any
    ttl_seconds: int
    applied_at: str
    expires_at: str
    active: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "override_id": self.override_id,
            "subsystem": self.subsystem,
            "parameter": self.parameter,
            "value": self.value,
            "ttl_seconds": self.ttl_seconds,
            "applied_at": self.applied_at,
            "expires_at": self.expires_at,
            "active": self.active,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Override":
        return cls(
            override_id=str(d.get("override_id", "")),
            subsystem=str(d.get("subsystem", "")),
            parameter=str(d.get("parameter", "")),
            value=d.get("value"),
            ttl_seconds=int(d.get("ttl_seconds", _DEFAULT_TTL)),
            applied_at=str(d.get("applied_at", "")),
            expires_at=str(d.get("expires_at", "")),
            active=bool(d.get("active", True)),
        )

    def is_expired(self) -> bool:
        try:
            exp = datetime.fromisoformat(self.expires_at)
            return datetime.now(timezone.utc) >= exp
        except Exception:
            return True


_VALID_SUBSYSTEMS = {"bridge", "cost", "combat", "seal"}


class ZeroPointOverride:
    """Full-system override controller — SOVEREIGN seal required."""

    def __init__(self, overrides_file: Path = _OVERRIDES_FILE) -> None:
        self._overrides_file = overrides_file

    def _validate_sovereign(self, operator_key: str, doctrine_hash: str) -> None:
        """Validate SOVEREIGN seal: operator key + doctrine hash."""
        from swarmz_runtime.governance.seal_matrix import get_seal_matrix
        result = get_seal_matrix().approve(
            "/v1/zeropoint/override", operator_key, doctrine_hash
        )
        if not result.approved:
            raise PermissionError(f"SOVEREIGN seal required: {result.reason}")

    def _read_entries(self) -> list[dict[str, Any]]:
        if not self._overrides_file.exists():
            return []
        entries = []
        for line in self._overrides_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries

    def _append_entry(self, entry: dict[str, Any]) -> None:
        self._overrides_file.parent.mkdir(parents=True, exist_ok=True)
        with self._overrides_file.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")

    def apply(
        self,
        subsystem: str,
        parameter: str,
        value: Any,
        operator_key: str,
        doctrine_hash: str,
        ttl_seconds: int = _DEFAULT_TTL,
    ) -> Override:
        """Apply a system override. SOVEREIGN seal required."""
        if subsystem not in _VALID_SUBSYSTEMS:
            raise ValueError(
                f"Unknown subsystem '{subsystem}'. Valid: {sorted(_VALID_SUBSYSTEMS)}"
            )
        self._validate_sovereign(operator_key, doctrine_hash)

        now = datetime.now(timezone.utc)
        from datetime import timedelta
        expires = now + timedelta(seconds=ttl_seconds)

        override = Override(
            override_id=secrets.token_hex(6),
            subsystem=subsystem,
            parameter=parameter,
            value=value,
            ttl_seconds=ttl_seconds,
            applied_at=now.isoformat(),
            expires_at=expires.isoformat(),
            active=True,
        )
        self._append_entry({"type": "apply", **override.to_dict()})
        return override

    def expire(self, override_id: str) -> bool:
        """Manually expire an override before its TTL. Returns True if found."""
        entries = self._read_entries()
        found = any(
            e.get("override_id") == override_id and e.get("type") == "apply"
            for e in entries
        )
        if not found:
            return False
        self._append_entry({
            "type": "expire",
            "override_id": override_id,
            "expired_at": _now_iso(),
        })
        return True

    def list_overrides(self) -> list[dict[str, Any]]:
        """Return all overrides with current active/expired status."""
        entries = self._read_entries()
        applies = {e["override_id"]: e for e in entries if e.get("type") == "apply"}
        manually_expired = {
            e["override_id"] for e in entries if e.get("type") == "expire"
        }
        result = []
        for oid, entry in applies.items():
            override = Override.from_dict(entry)
            if oid in manually_expired or override.is_expired():
                override.active = False
            result.append(override.to_dict())
        return result

    def active_overrides(self) -> list[dict[str, Any]]:
        """Return only currently active (non-expired) overrides."""
        return [o for o in self.list_overrides() if o.get("active")]

    def status_summary(self) -> dict[str, Any]:
        """Return a summary of active overrides grouped by subsystem."""
        active = self.active_overrides()
        by_subsystem: dict[str, list[dict[str, Any]]] = {}
        for o in active:
            by_subsystem.setdefault(o["subsystem"], []).append(o)
        return {
            "total_active": len(active),
            "by_subsystem": by_subsystem,
        }


def get_zero_point_override() -> ZeroPointOverride:
    """Return the global ZeroPointOverride singleton."""
    global _ZERO_POINT_OVERRIDE
    if _ZERO_POINT_OVERRIDE is None:
        with _LOCK:
            if _ZERO_POINT_OVERRIDE is None:
                _ZERO_POINT_OVERRIDE = ZeroPointOverride()
    return _ZERO_POINT_OVERRIDE
