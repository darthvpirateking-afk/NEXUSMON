"""NEXUSMON Autonomy Engine — operator-supervised action proposal system.

NEXUSMON can propose multi-step action chains. Proposals sit in a queue until
the operator explicitly approves or rejects each one. On approval, the chain is
dispatched via CommandFusion. NEXUSMON cannot self-execute — operator control
is absolute at all times per the Prime Directive.

autonomy trait: reserved for ZERO-POINT FORM only.

All proposals and decisions are persisted at artifacts/zeropoint/autonomy_queue.jsonl.
"""

from __future__ import annotations

import json
import secrets
import threading
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

_QUEUE_FILE = Path("artifacts/zeropoint/autonomy_queue.jsonl")
_LOCK = threading.Lock()
_AUTONOMY_ENGINE: AutonomyEngine | None = None


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class Proposal:
    proposal_id: str
    title: str
    rationale: str
    steps: list
    proposed_at: str
    status: str = "pending"  # pending | approved | rejected
    decided_at: str | None = None
    outcome: dict | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "proposal_id": self.proposal_id,
            "title": self.title,
            "rationale": self.rationale,
            "steps": list(self.steps),
            "proposed_at": self.proposed_at,
            "status": self.status,
            "decided_at": self.decided_at,
            "outcome": self.outcome,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Proposal:
        return cls(
            proposal_id=str(d.get("proposal_id", "")),
            title=str(d.get("title", "")),
            rationale=str(d.get("rationale", "")),
            steps=list(d.get("steps", [])),
            proposed_at=str(d.get("proposed_at", "")),
            status=str(d.get("status", "pending")),
            decided_at=d.get("decided_at"),
            outcome=d.get("outcome"),
        )


class AutonomyEngine:
    """Operator-supervised action proposal queue for NEXUSMON autonomy."""

    def __init__(self, queue_file: Path = _QUEUE_FILE) -> None:
        self._queue_file = queue_file

    def _read_entries(self) -> list[dict[str, Any]]:
        if not self._queue_file.exists():
            return []
        entries = []
        for line in self._queue_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries

    def _append_entry(self, entry: dict[str, Any]) -> None:
        self._queue_file.parent.mkdir(parents=True, exist_ok=True)
        with self._queue_file.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")

    def _get_proposal(self, proposal_id: str) -> Proposal | None:
        entries = self._read_entries()
        # Find the most recent state entry for this proposal_id
        proposal_entry = None
        for e in entries:
            if e.get("proposal_id") == proposal_id and e.get("type") == "propose":
                proposal_entry = e
        if not proposal_entry:
            return None
        # Check for decision
        decisions = [
            e
            for e in entries
            if e.get("proposal_id") == proposal_id and e.get("type") in ("approve", "reject")
        ]
        proposal = Proposal.from_dict(proposal_entry)
        if decisions:
            last_decision = decisions[-1]
            proposal.status = "approved" if last_decision["type"] == "approve" else "rejected"
            proposal.decided_at = last_decision.get("decided_at")
            proposal.outcome = last_decision.get("outcome")
        return proposal

    def propose(
        self,
        title: str,
        steps: list[dict[str, Any]],
        rationale: str = "",
    ) -> Proposal:
        """Submit a new action proposal to the operator queue."""
        if not title.strip():
            raise ValueError("Proposal title cannot be empty")
        if not steps:
            raise ValueError("Proposal must have at least one step")

        proposal = Proposal(
            proposal_id=secrets.token_hex(6),
            title=title.strip(),
            rationale=rationale.strip(),
            steps=list(steps),
            proposed_at=_now_iso(),
            status="pending",
        )
        self._append_entry({"type": "propose", **proposal.to_dict()})
        return proposal

    def approve(self, proposal_id: str, operator_key: str) -> dict[str, Any]:
        """Operator approves a proposal — dispatches via CommandFusion."""
        from swarmz_runtime.shadow.executor import validate_operator_key

        validate_operator_key(operator_key)

        proposal = self._get_proposal(proposal_id)
        if proposal is None:
            raise ValueError(f"Proposal '{proposal_id}' not found")
        if proposal.status != "pending":
            raise ValueError(f"Proposal '{proposal_id}' is already {proposal.status}")

        outcome: dict[str, Any] = {}
        try:
            import asyncio

            from swarmz_runtime.doctrine.command_fusion import (
                FusionScript,
                FusionStep,
                get_command_fusion,
            )

            steps = [FusionStep.from_dict(s) for s in proposal.steps]
            script = FusionScript(
                steps=steps,
                name=f"autonomy:{proposal.title}",
                operator_key=operator_key,
            )
            result = asyncio.run(get_command_fusion().execute_fusion(script))
            outcome = result.to_dict()
        except Exception as exc:
            outcome = {"error": str(exc)}

        self._append_entry(
            {
                "type": "approve",
                "proposal_id": proposal_id,
                "decided_at": _now_iso(),
                "outcome": outcome,
            }
        )
        return {"proposal_id": proposal_id, "status": "approved", "outcome": outcome}

    def reject(self, proposal_id: str, reason: str = "") -> dict[str, Any]:
        """Operator rejects a proposal — discards without execution."""
        proposal = self._get_proposal(proposal_id)
        if proposal is None:
            raise ValueError(f"Proposal '{proposal_id}' not found")
        if proposal.status != "pending":
            raise ValueError(f"Proposal '{proposal_id}' is already {proposal.status}")

        self._append_entry(
            {
                "type": "reject",
                "proposal_id": proposal_id,
                "decided_at": _now_iso(),
                "reason": reason.strip(),
                "outcome": {"rejected": True, "reason": reason.strip()},
            }
        )
        return {"proposal_id": proposal_id, "status": "rejected"}

    def pending_queue(self) -> list[dict[str, Any]]:
        """Return all proposals still awaiting operator decision."""
        entries = self._read_entries()
        proposal_entries = {e["proposal_id"]: e for e in entries if e.get("type") == "propose"}
        decided = {e["proposal_id"] for e in entries if e.get("type") in ("approve", "reject")}
        return [
            Proposal.from_dict(v).to_dict() for k, v in proposal_entries.items() if k not in decided
        ]

    def history(self) -> list[dict[str, Any]]:
        """Return all proposals with their final status."""
        entries = self._read_entries()
        proposal_ids = [e["proposal_id"] for e in entries if e.get("type") == "propose"]
        seen: set[str] = set()
        result = []
        for pid in proposal_ids:
            if pid in seen:
                continue
            seen.add(pid)
            p = self._get_proposal(pid)
            if p:
                result.append(p.to_dict())
        return result


def get_autonomy_engine() -> AutonomyEngine:
    """Return the global AutonomyEngine singleton."""
    global _AUTONOMY_ENGINE
    if _AUTONOMY_ENGINE is None:
        with _LOCK:
            if _AUTONOMY_ENGINE is None:
                _AUTONOMY_ENGINE = AutonomyEngine()
    return _AUTONOMY_ENGINE
