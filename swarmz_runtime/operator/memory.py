"""NEXUSMON Operator Memory — persistent session memory for the sovereign operator.

Regan Stewart Harris. Session continuity. Relationship state.
Every session recorded. Nothing forgotten.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

_ARTIFACTS_DIR = Path("artifacts/operator")
_MEMORY_PATH = Path("artifacts/operator/memory.jsonl")
_ANCHOR_PATH = Path("data/memory/archive/regan_core_memory_anchor.json")
_LOCK = threading.Lock()
_OPERATOR_MEMORY: OperatorMemory | None = None


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _compute_relationship(session_count: int) -> str:
    if session_count < 5:
        return "ROOKIE"
    if session_count <= 20:
        return "TRUSTED"
    return "SOVEREIGN"


@dataclass
class MemoryEntry:
    name: str = ""
    session_count: int = 0
    total_missions: int = 0
    last_seen: str = ""
    milestones: list = field(default_factory=list)
    operator_notes: str = ""
    relationship_state: str = "ROOKIE"
    created_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "session_count": self.session_count,
            "total_missions": self.total_missions,
            "last_seen": self.last_seen,
            "milestones": list(self.milestones),
            "operator_notes": self.operator_notes,
            "relationship_state": self.relationship_state,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> MemoryEntry:
        return cls(
            name=d.get("name", ""),
            session_count=int(d.get("session_count", 0)),
            total_missions=int(d.get("total_missions", 0)),
            last_seen=d.get("last_seen", ""),
            milestones=list(d.get("milestones", [])),
            operator_notes=d.get("operator_notes", ""),
            relationship_state=d.get("relationship_state", "ROOKIE"),
            created_at=d.get("created_at", ""),
        )


class OperatorMemory:
    """Persistent operator memory — additive JSONL, never overwrites."""

    def __init__(self, path: Path = _MEMORY_PATH) -> None:
        self._path = path

    def _bootstrap(self) -> MemoryEntry:
        """Seed initial entry from Regan's core memory anchor if present."""
        entry = MemoryEntry(
            name="",
            session_count=0,
            total_missions=0,
            last_seen="",
            milestones=[],
            operator_notes="",
            relationship_state="ROOKIE",
            created_at=_now_iso(),
        )
        try:
            if _ANCHOR_PATH.exists():
                anchor = json.loads(_ANCHOR_PATH.read_text(encoding="utf-8"))
                raw_name = anchor.get("operator", "")
                if raw_name:
                    entry.name = str(raw_name).strip()
                entry.created_at = anchor.get("timestamp", entry.created_at)
        except Exception:
            pass
        return entry

    def load(self) -> MemoryEntry:
        """Read the last valid entry from JSONL; bootstrap from anchor if none exists."""
        try:
            if self._path.exists():
                lines = self._path.read_text(encoding="utf-8").strip().splitlines()
                for line in reversed(lines):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        row = json.loads(line)
                        if "name" in row:
                            entry = MemoryEntry.from_dict(row)
                            entry.relationship_state = _compute_relationship(entry.session_count)
                            return entry
                    except json.JSONDecodeError:
                        continue
        except Exception:
            pass
        return self._bootstrap()

    def _append(self, entry: MemoryEntry) -> None:
        """Write a new entry to the JSONL file (additive only, never overwrites)."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with self._path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry.to_dict()) + "\n")

    def record_session(self) -> MemoryEntry:
        """Increment session count, update last_seen, persist."""
        entry = self.load()
        entry.session_count += 1
        entry.last_seen = _now_iso()
        entry.relationship_state = _compute_relationship(entry.session_count)
        if not entry.created_at:
            entry.created_at = entry.last_seen
        self._append(entry)
        return entry

    def introduce(self, name: str) -> MemoryEntry:
        """Register operator name (first-time only — no overwrite if already named)."""
        entry = self.load()
        name = name.strip()
        if not name:
            raise ValueError("name cannot be empty")
        if not entry.name:
            entry.name = name
            self._append(entry)
        return entry

    def add_note(self, note: str) -> MemoryEntry:
        """Append a note to operator_notes."""
        entry = self.load()
        note = note.strip()
        if note:
            existing = entry.operator_notes.strip()
            entry.operator_notes = f"{existing}\n{note}".strip() if existing else note
            self._append(entry)
        return entry

    def record_milestone(self, text: str) -> MemoryEntry:
        """Append a permanent milestone. Never removed."""
        entry = self.load()
        text = text.strip()
        if text:
            entry.milestones = list(entry.milestones)
            entry.milestones.append(text)
            self._append(entry)
        return entry

    def greet(self) -> str:
        """Generate a context-aware greeting for the operator."""
        entry = self.load()
        if entry.session_count == 0 or not entry.name.strip():
            return "Operator identity unregistered. Who are you?"
        name = entry.name
        n = entry.session_count
        missions = entry.total_missions
        if entry.last_seen:
            try:
                last = datetime.fromisoformat(entry.last_seen)
                now = datetime.now(UTC)
                if last.tzinfo is None:
                    last = last.replace(tzinfo=UTC)
                delta = now - last
                if delta.days > 7:
                    return f"You were gone {delta.days} days. Systems maintained. Ready."
            except Exception:
                pass
        return f"Welcome back {name}. Session {n}. {missions} missions together."


def get_operator_memory() -> OperatorMemory:
    """Return the global OperatorMemory singleton."""
    global _OPERATOR_MEMORY
    if _OPERATOR_MEMORY is None:
        with _LOCK:
            if _OPERATOR_MEMORY is None:
                _OPERATOR_MEMORY = OperatorMemory()
    return _OPERATOR_MEMORY
