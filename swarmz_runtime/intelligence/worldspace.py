"""WorldSpace — NEXUSMON's persistent knowledge universe.

Every cosmic query becomes a node. Every connection becomes an edge.
The longer Regan works with Nexusmon, the deeper the world-space grows.
Permanent. Additive. Sovereign.
"""
from __future__ import annotations

import json
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from swarmz_runtime.intelligence.cosmic import ScaleLevel


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class WorldSpaceEntry:
    entry_id: str
    subject: str
    scale: ScaleLevel
    content: str
    connections: list[str]          # other entry_ids this connects to
    timestamp: str                  # ISO8601 UTC
    operator: str                   # always "Regan Harris"
    tags: list[str]
    depth: str                      # SURFACE | DEEP | PROFOUND

    def to_dict(self) -> dict[str, Any]:
        return {
            "entry_id": self.entry_id,
            "subject": self.subject,
            "scale": self.scale.value,
            "content": self.content,
            "connections": self.connections,
            "timestamp": self.timestamp,
            "operator": self.operator,
            "tags": self.tags,
            "depth": self.depth,
        }

    @staticmethod
    def from_dict(d: dict[str, Any]) -> "WorldSpaceEntry":
        return WorldSpaceEntry(
            entry_id=d["entry_id"],
            subject=d["subject"],
            scale=ScaleLevel(d["scale"]),
            content=d["content"],
            connections=d.get("connections", []),
            timestamp=d["timestamp"],
            operator=d.get("operator", "Regan Harris"),
            tags=d.get("tags", []),
            depth=d.get("depth", "SURFACE"),
        )


@dataclass
class SynthesisArtifact:
    entry_ids: list[str]
    synthesis: str
    artifact_id: str
    render_url: str
    entry_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "entry_ids": self.entry_ids,
            "synthesis": self.synthesis,
            "artifact_id": self.artifact_id,
            "render_url": self.render_url,
            "entry_count": self.entry_count,
        }


# ---------------------------------------------------------------------------
# WorldSpace
# ---------------------------------------------------------------------------

class WorldSpace:
    """The accumulated knowledge universe of NEXUSMON.

    Entries stored as individual JSON files. Graph edges in JSONL.
    Fully additive — nothing is ever deleted.
    """

    def __init__(self, artifacts_dir: Path | None = None) -> None:
        self._dir = artifacts_dir or Path("artifacts/worldspace")
        self._graph_log = self._dir / "_graph.jsonl"
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_dir(self) -> None:
        self._dir.mkdir(parents=True, exist_ok=True)

    def _entry_path(self, entry_id: str) -> Path:
        return self._dir / f"{entry_id}.json"

    def _load_all(self) -> list[WorldSpaceEntry]:
        """Load all entries from disk (excluding _graph.jsonl and hidden files)."""
        if not self._dir.exists():
            return []
        entries: list[WorldSpaceEntry] = []
        for p in self._dir.glob("*.json"):
            if p.name.startswith("_"):
                continue
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                entries.append(WorldSpaceEntry.from_dict(data))
            except Exception:
                continue
        return entries

    def _append_graph(self, record: dict[str, Any]) -> None:
        try:
            self._ensure_dir()
            with self._lock:
                with self._graph_log.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(record) + "\n")
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add(self, entry: WorldSpaceEntry) -> str:
        """Store an entry permanently. Returns entry_id."""
        self._ensure_dir()
        with self._lock:
            path = self._entry_path(entry.entry_id)
            path.write_text(json.dumps(entry.to_dict(), indent=2), encoding="utf-8")
        return entry.entry_id

    def get(self, entry_id: str) -> WorldSpaceEntry | None:
        """Retrieve a single entry by ID."""
        path = self._entry_path(entry_id)
        if not path.exists():
            return None
        try:
            return WorldSpaceEntry.from_dict(json.loads(path.read_text(encoding="utf-8")))
        except Exception:
            return None

    def search(
        self,
        query: str,
        scale: ScaleLevel | str | None = None,
    ) -> list[WorldSpaceEntry]:
        """Full-text search across all entries. Optional scale filter."""
        query_lower = query.lower()
        scale_filter: ScaleLevel | None = None
        if scale is not None:
            scale_filter = ScaleLevel(scale.lower()) if isinstance(scale, str) else scale

        results: list[WorldSpaceEntry] = []
        for entry in self._load_all():
            if scale_filter and entry.scale != scale_filter:
                continue
            haystack = " ".join([
                entry.subject, entry.content,
                " ".join(entry.tags), entry.depth,
            ]).lower()
            if query_lower in haystack:
                results.append(entry)
        # Most recent first
        results.sort(key=lambda e: e.timestamp, reverse=True)
        return results

    def connect(
        self,
        entry_a_id: str,
        entry_b_id: str,
        relationship: str,
    ) -> dict[str, Any]:
        """Link two entries with a named relationship. Additive — both entries updated."""
        timestamp = datetime.now(timezone.utc).isoformat()

        with self._lock:
            for eid, other_id in [(entry_a_id, entry_b_id), (entry_b_id, entry_a_id)]:
                path = self._entry_path(eid)
                if path.exists():
                    try:
                        data = json.loads(path.read_text(encoding="utf-8"))
                        connections = data.get("connections", [])
                        if other_id not in connections:
                            connections.append(other_id)
                        data["connections"] = connections
                        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
                    except Exception:
                        pass

        edge = {
            "entry_a": entry_a_id,
            "entry_b": entry_b_id,
            "relationship": relationship,
            "timestamp": timestamp,
        }
        self._append_graph(edge)

        return {"ok": True, "edge": edge}

    def synthesize(self, entry_ids: list[str]) -> SynthesisArtifact:
        """Synthesize multiple entries into a unified insight artifact."""
        entries = [e for eid in entry_ids if (e := self.get(eid)) is not None]
        artifact_id = uuid.uuid4().hex[:16]

        if not entries:
            return SynthesisArtifact(
                entry_ids=entry_ids,
                synthesis="No entries found for synthesis.",
                artifact_id=artifact_id,
                render_url=f"/v1/artifacts/{artifact_id}/render/report",
                entry_count=0,
            )

        parts: list[str] = []
        for e in entries:
            parts.append(
                f"[{e.scale.value.upper()} | {e.depth}] {e.subject}\n{e.content[:800]}"
            )

        synthesis = (
            f"WORLDSPACE SYNTHESIS — {len(entries)} entries\n"
            f"Operator: {entries[0].operator}\n"
            f"Scales: {', '.join(sorted({e.scale.value for e in entries}))}\n\n"
            + "\n\n---\n\n".join(parts)
        )

        # Auto-render
        try:
            from swarmz_runtime.artifacts.renderer import get_renderer
            get_renderer().render(
                artifact_id, synthesis, "report",
                title=f"WorldSpace Synthesis · {len(entries)} entries",
                scale="MULTI-SCALE",
                depth="PROFOUND",
            )
        except Exception:
            pass

        return SynthesisArtifact(
            entry_ids=entry_ids,
            synthesis=synthesis,
            artifact_id=artifact_id,
            render_url=f"/v1/artifacts/{artifact_id}/render/report",
            entry_count=len(entries),
        )

    def map(self) -> dict[str, Any]:
        """Return the full knowledge graph as JSON (nodes + edges)."""
        entries = self._load_all()

        nodes = [
            {
                "id": e.entry_id,
                "label": e.subject,
                "scale": e.scale.value,
                "depth": e.depth,
                "timestamp": e.timestamp,
                "connection_count": len(e.connections),
                "tags": e.tags,
            }
            for e in entries
        ]

        # Load edges from graph log
        edges: list[dict[str, Any]] = []
        if self._graph_log.exists():
            try:
                for line in self._graph_log.read_text(encoding="utf-8").splitlines():
                    if line.strip():
                        edges.append(json.loads(line))
            except Exception:
                pass

        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges),
        }

    def export(self) -> dict[str, Any]:
        """Export full worldspace as a portable archive."""
        entries = self._load_all()
        graph = self.map()
        return {
            "operator": "Regan Harris",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "entries": [e.to_dict() for e in entries],
            "graph": graph,
            "entry_count": len(entries),
        }


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_WORLD_SPACE: WorldSpace | None = None
_WS_LOCK = threading.Lock()


def get_world_space() -> WorldSpace:
    global _WORLD_SPACE
    if _WORLD_SPACE is None:
        with _WS_LOCK:
            if _WORLD_SPACE is None:
                _WORLD_SPACE = WorldSpace()
    return _WORLD_SPACE
