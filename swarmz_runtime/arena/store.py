"""
arena/store.py – JSONL-backed storage for arena runs and candidates.

Uses the same robust JSONL utilities as the rest of SWARMZ.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from swarmz_runtime.storage.jsonl_utils import append_jsonl, read_jsonl, write_jsonl


class ArenaStore:
    """Persist arena runs and candidates to JSONL files."""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.runs_file = self.data_dir / "arena_runs.jsonl"
        self.candidates_file = self.data_dir / "arena_candidates.jsonl"

    # ── Runs ─────────────────────────────────────────────────────────

    def save_run(self, run: dict[str, Any]) -> None:
        append_jsonl(self.runs_file, run)

    @staticmethod
    def _records(payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, tuple):
            payload = payload[0] if payload else []
        if not isinstance(payload, list):
            return []
        return [item for item in payload if isinstance(item, dict)]

    def update_run(self, run_id: str, updates: dict[str, Any]) -> None:
        runs = self._records(read_jsonl(self.runs_file))
        for r in runs:
            if r.get("id") == run_id:
                r.update(updates)
        write_jsonl(self.runs_file, runs)

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        for r in self._records(read_jsonl(self.runs_file)):
            if r.get("id") == run_id:
                return r
        return None

    def list_runs(self, limit: int = 50) -> list[dict[str, Any]]:
        rows = self._records(read_jsonl(self.runs_file))
        return rows[-limit:]

    # ── Candidates ───────────────────────────────────────────────────

    def save_candidate(self, candidate: dict[str, Any]) -> None:
        append_jsonl(self.candidates_file, candidate)

    def update_candidate(self, candidate_id: str, updates: dict[str, Any]) -> None:
        cands = self._records(read_jsonl(self.candidates_file))
        for c in cands:
            if c.get("id") == candidate_id:
                c.update(updates)
        write_jsonl(self.candidates_file, cands)

    def get_candidates_for_run(self, run_id: str) -> list[dict[str, Any]]:
        return [
            c for c in self._records(read_jsonl(self.candidates_file)) if c.get("run_id") == run_id
        ]

    def get_candidate(self, candidate_id: str) -> dict[str, Any] | None:
        for c in self._records(read_jsonl(self.candidates_file)):
            if c.get("id") == candidate_id:
                return c
        return None
