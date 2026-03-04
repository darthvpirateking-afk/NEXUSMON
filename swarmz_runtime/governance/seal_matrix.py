"""NEXUSMON Seal Matrix — multi-level approval gate for sovereign actions.

SealLevel OPEN: no auth required.
SealLevel OPERATOR: valid operator key required.
SealLevel DUAL: two sequential approvals with valid operator key.
SealLevel SOVEREIGN: valid operator key + correct NEXUSMON_DOCTRINE.md SHA-256 hash.
"""
from __future__ import annotations

import hashlib
import secrets
import threading
from dataclasses import dataclass
from enum import IntEnum
from pathlib import Path
from typing import Any

_DOCTRINE_PATH = Path("docs/NEXUSMON_DOCTRINE.md")
_LOCK = threading.Lock()
_SEAL_MATRIX: "SealMatrix | None" = None


class SealLevel(IntEnum):
    OPEN = 0
    OPERATOR = 1
    DUAL = 2
    SOVEREIGN = 3


@dataclass
class ApprovalResult:
    approved: bool
    action: str
    seal_level: str
    reason: str
    token: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "approved": self.approved,
            "action": self.action,
            "seal_level": self.seal_level,
            "reason": self.reason,
            "token": self.token,
        }


_DEFAULT_REGISTRY: dict[str, SealLevel] = {
    "/v1/kernel/shift": SealLevel.OPERATOR,
    "/v1/kernel/rollback": SealLevel.DUAL,
    "/v1/shadow/execute": SealLevel.OPERATOR,
    "/v1/federation/coordinate": SealLevel.OPERATOR,
    "/v1/legacy/seal": SealLevel.SOVEREIGN,
    "/v1/offworld/activate": SealLevel.DUAL,
    "/v1/legacy/continuity/generate": SealLevel.SOVEREIGN,
    "/v1/genome/import": SealLevel.SOVEREIGN,
    # ZERO-POINT FORM
    "/v1/zeropoint/override": SealLevel.SOVEREIGN,
    "/v1/quantum/collapse": SealLevel.OPERATOR,
    "/v1/autonomy/approve": SealLevel.OPERATOR,
}


class SealMatrix:
    """Multi-level approval gate for NEXUSMON sovereign actions."""

    def __init__(self) -> None:
        self._registry: dict[str, SealLevel] = dict(_DEFAULT_REGISTRY)
        self._pending_approvals: dict[str, list[str]] = {}
        self._doctrine_hash_cache: str | None = None

    def _get_doctrine_hash(self) -> str:
        """Compute (and cache) SHA-256 of NEXUSMON_DOCTRINE.md."""
        if self._doctrine_hash_cache is None:
            try:
                content = _DOCTRINE_PATH.read_bytes()
                self._doctrine_hash_cache = hashlib.sha256(content).hexdigest()
            except Exception:
                self._doctrine_hash_cache = ""
        return self._doctrine_hash_cache

    def _validate_key(self, operator_key: str) -> None:
        from swarmz_runtime.shadow.executor import validate_operator_key
        validate_operator_key(operator_key)

    def approve(
        self,
        action: str,
        operator_key: str,
        provided_hash: str | None = None,
    ) -> ApprovalResult:
        """Evaluate an approval request against the action's seal level."""
        seal_level = self._registry.get(action, SealLevel.OPEN)

        if seal_level == SealLevel.OPEN:
            return ApprovalResult(
                approved=True, action=action, seal_level="OPEN",
                reason="open action — no auth required"
            )

        # All levels >= OPERATOR require a valid key
        try:
            self._validate_key(operator_key)
        except Exception as exc:
            return ApprovalResult(
                approved=False, action=action, seal_level=seal_level.name,
                reason=f"operator key invalid: {exc}"
            )

        if seal_level == SealLevel.OPERATOR:
            return ApprovalResult(
                approved=True, action=action, seal_level="OPERATOR",
                reason="operator key valid"
            )

        if seal_level == SealLevel.DUAL:
            pending = self._pending_approvals.get(action, [])
            if not pending:
                token = secrets.token_hex(8)
                self._pending_approvals[action] = [token]
                return ApprovalResult(
                    approved=False, action=action, seal_level="DUAL",
                    reason="first approval recorded — call approve again to confirm",
                    token=token,
                )
            # Second approval — clear pending and approve
            self._pending_approvals.pop(action, None)
            return ApprovalResult(
                approved=True, action=action, seal_level="DUAL",
                reason="dual approval complete"
            )

        if seal_level == SealLevel.SOVEREIGN:
            if provided_hash is None:
                doctrine_hash = self._get_doctrine_hash()
                return ApprovalResult(
                    approved=False, action=action, seal_level="SOVEREIGN",
                    reason=(
                        f"sovereign actions require doctrine hash. "
                        f"Expected SHA-256 of docs/NEXUSMON_DOCTRINE.md: {doctrine_hash}"
                    )
                )
            actual = self._get_doctrine_hash()
            if provided_hash.strip().lower() != actual:
                return ApprovalResult(
                    approved=False, action=action, seal_level="SOVEREIGN",
                    reason="doctrine hash mismatch — doctrine may have been modified"
                )
            return ApprovalResult(
                approved=True, action=action, seal_level="SOVEREIGN",
                reason="sovereign approval granted"
            )

        return ApprovalResult(
            approved=False, action=action, seal_level="UNKNOWN",
            reason="unknown seal level"
        )

    def submit_dual_approval(self, action: str, operator_key: str) -> str:
        """Submit the first half of a DUAL approval. Returns the pending token."""
        self._validate_key(operator_key)
        token = secrets.token_hex(8)
        self._pending_approvals[action] = [token]
        return token

    def status(self) -> dict[str, str]:
        """Return the seal level for every registered action."""
        return {action: level.name for action, level in self._registry.items()}

    def pending(self) -> dict[str, list[str]]:
        """Return all actions currently awaiting second dual approval."""
        return dict(self._pending_approvals)


def get_seal_matrix() -> SealMatrix:
    """Return the global SealMatrix singleton."""
    global _SEAL_MATRIX
    if _SEAL_MATRIX is None:
        with _LOCK:
            if _SEAL_MATRIX is None:
                _SEAL_MATRIX = SealMatrix()
    return _SEAL_MATRIX
