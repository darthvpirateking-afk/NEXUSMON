"""NEXUSMON Operator Lock — one operator, one companion, permanent binding.

Regan Harris. One operator. Forever.

This is not a permission system. This is a binding.
Every request is checked. Only the bound operator receives responses.
Wrong key or no key: HTTP 204. Silence. No information given.
"""
from __future__ import annotations

import hashlib
import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_BINDING_PATH = Path("artifacts/operator/binding.json")
_LOCK = threading.Lock()
_OPERATOR_LOCK: "OperatorLock | None" = None


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class OperatorLock:
    """One operator. One companion. Permanent binding.

    On first boot (no binding.json): all requests pass through.
    After binding (binding.json written): only the bound operator gets responses.
    The binding is written once, never overwritten.
    """

    def __init__(self, binding_path: Path = _BINDING_PATH) -> None:
        self._path = binding_path
        self._binding: dict[str, Any] | None = self._load()

    def _load(self) -> dict[str, Any] | None:
        """Load existing binding from disk. Returns None if unbound."""
        try:
            if self._path.exists():
                data = json.loads(self._path.read_text(encoding="utf-8"))
                if data.get("operator_name") and data.get("operator_key_hash"):
                    return data
        except Exception:
            pass
        return None

    def is_bound(self) -> bool:
        """Return True if a binding has been written to disk."""
        return self._binding is not None

    def bind(self, name: str, operator_key: str) -> dict[str, Any]:
        """Bind the operator. Written once. Never overwrites.

        Called on first introduce(). If already bound, returns existing binding unchanged.
        """
        with _LOCK:
            # Reload in case another thread already wrote the binding
            refreshed = self._load()
            if refreshed is not None:
                self._binding = refreshed
                return refreshed
            binding: dict[str, Any] = {
                "operator_name": name.strip(),
                "operator_key_hash": _hash_key(operator_key),
                "since": _now_iso(),
            }
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._path.write_text(json.dumps(binding), encoding="utf-8")
            self._binding = binding
            return binding

    def check(self, operator_key: str | None) -> bool:
        """Return True if the request should proceed.

        Unbound system: always True (allows first introduce to bind).
        Bound system: True only if the key matches the stored hash.
        False = the caller returns HTTP 204. Silence.
        """
        if not self.is_bound():
            return True
        if not operator_key:
            return False
        return _hash_key(operator_key.strip()) == self._binding["operator_key_hash"]  # type: ignore[index]

    def status(self) -> dict[str, Any]:
        """Return binding status. Always callable — no key required."""
        if not self.is_bound():
            return {"bound": False}
        return {
            "bound": True,
            "operator": self._binding["operator_name"],  # type: ignore[index]
            "since": self._binding["since"],  # type: ignore[index]
        }


def get_operator_lock() -> OperatorLock:
    """Return the global OperatorLock singleton."""
    global _OPERATOR_LOCK
    if _OPERATOR_LOCK is None:
        with _LOCK:
            if _OPERATOR_LOCK is None:
                _OPERATOR_LOCK = OperatorLock()
    return _OPERATOR_LOCK
