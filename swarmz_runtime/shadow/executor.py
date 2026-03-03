"""NEXUSMON Shadow Executor — low-visibility mission execution.

Shadow missions:
- Require operator key authentication
- Emit no audit trail to the main audit log
- Are never listed in /v1/missions/list
- Have their output encrypted at rest in artifacts/shadow/

Encryption: XOR stream cipher keyed on SHA-256(operator_key).
Artifacts are stored as base64-encoded ciphertext — not plaintext.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

_SHADOW_DIR = Path("artifacts/shadow")
_ENV_KEY = "NEXUSMON_OPERATOR_KEY"
_DEFAULT_KEY = "swarmz_sovereign_key"


# ── Operator key ──────────────────────────────────────────────────────────────


class OperatorKeyRequired(PermissionError):
    """Raised when the provided operator key is invalid or missing."""


def _expected_key() -> str:
    return os.environ.get(_ENV_KEY, _DEFAULT_KEY)


def validate_operator_key(key: str) -> None:
    """Raise OperatorKeyRequired if key does not match the configured key."""
    if not key or key.strip() != _expected_key():
        raise OperatorKeyRequired(
            "Shadow execution requires a valid operator key. Access denied."
        )


# ── Encryption ────────────────────────────────────────────────────────────────


def _derive_key(operator_key: str) -> bytes:
    """Derive a 32-byte key from the operator key via SHA-256."""
    return hashlib.sha256(operator_key.encode()).digest()


def _xor_stream(data: bytes, key: bytes) -> bytes:
    """XOR data against repeating key (stream cipher)."""
    key_len = len(key)
    return bytes(b ^ key[i % key_len] for i, b in enumerate(data))


def seal(data: str, operator_key: str) -> str:
    """Encrypt plaintext string → base64-encoded ciphertext."""
    raw = data.encode("utf-8")
    key = _derive_key(operator_key)
    return base64.b64encode(_xor_stream(raw, key)).decode("ascii")


def unseal(ciphertext: str, operator_key: str) -> str:
    """Decrypt base64-encoded ciphertext → plaintext string."""
    encrypted = base64.b64decode(ciphertext.encode("ascii"))
    key = _derive_key(operator_key)
    return _xor_stream(encrypted, key).decode("utf-8")


# ── Data model ────────────────────────────────────────────────────────────────


def _utc() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ShadowMission:
    """Result of a shadow execution. Output is returned to the authenticated
    caller but stored encrypted at rest. No audit trail is emitted."""

    shadow_id: str
    goal: str
    mode: str
    agent_id: str
    status: str           # "complete" | "error"
    output: str | None    # plaintext — only returned to the authenticated caller
    error: str | None
    tokens: int
    latency_ms: float
    executed_at: str
    completed_at: str

    def to_dict(self) -> dict:
        return {
            "shadow_id": self.shadow_id,
            "agent_id": self.agent_id,
            "mode": self.mode,
            "status": self.status,
            "output": self.output,
            "error": self.error,
            "tokens": self.tokens,
            "latency_ms": round(self.latency_ms, 2),
            "executed_at": self.executed_at,
            "completed_at": self.completed_at,
            "sealed": True,
        }


# ── Persistence ───────────────────────────────────────────────────────────────


def _write_shadow_artifact(mission: ShadowMission, operator_key: str) -> None:
    """Write shadow mission to disk with output encrypted. No plaintext stored."""
    try:
        _SHADOW_DIR.mkdir(parents=True, exist_ok=True)
        path = _SHADOW_DIR / f"{mission.shadow_id}.sealed"

        record = {
            "shadow_id": mission.shadow_id,
            "agent_id": mission.agent_id,
            "mode": mission.mode,
            "status": mission.status,
            "sealed_output": seal(mission.output or "", operator_key),
            "sealed_error": seal(mission.error or "", operator_key),
            "tokens": mission.tokens,
            "latency_ms": round(mission.latency_ms, 2),
            "executed_at": mission.executed_at,
            "completed_at": mission.completed_at,
        }
        path.write_text(json.dumps(record), encoding="utf-8")
    except Exception:
        pass


# ── Executor ──────────────────────────────────────────────────────────────────


async def execute(
    goal: str,
    mode: str = "strategic",
    agent_id: str = "nexusmon-shadow",
    operator_key: str = "",
) -> ShadowMission:
    """Execute a shadow mission — authenticated, low-visibility, no audit trail.

    Raises OperatorKeyRequired if the operator key is invalid.
    Shadow missions never interact with the main mission database.
    """
    validate_operator_key(operator_key)

    shadow_id = uuid4().hex[:12]
    executed_at = _utc()
    start = time.perf_counter()

    try:
        from swarmz_runtime.bridge.llm import call_v2
        bridge = await call_v2(
            prompt=goal,
            mode=mode,
            context={
                "agent_id": agent_id,
                "system": "You are NEXUSMON in shadow execution mode. Be precise. Leave no trace.",
            },
            budget_tokens=2048,
        )
        latency_ms = (time.perf_counter() - start) * 1000
        mission = ShadowMission(
            shadow_id=shadow_id,
            goal=goal,
            mode=mode,
            agent_id=agent_id,
            status="complete",
            output=bridge.content,
            error=None,
            tokens=bridge.tokens_used,
            latency_ms=latency_ms,
            executed_at=executed_at,
            completed_at=_utc(),
        )

    except Exception as exc:
        latency_ms = (time.perf_counter() - start) * 1000
        mission = ShadowMission(
            shadow_id=shadow_id,
            goal=goal,
            mode=mode,
            agent_id=agent_id,
            status="error",
            output=None,
            error=str(exc),
            tokens=0,
            latency_ms=latency_ms,
            executed_at=executed_at,
            completed_at=_utc(),
        )

    _write_shadow_artifact(mission, operator_key)
    return mission
