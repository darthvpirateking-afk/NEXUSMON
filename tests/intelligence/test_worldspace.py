"""Tests for WorldSpace Engine — Task 3 of v2.1.0 build."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest

from swarmz_runtime.intelligence.cosmic import ScaleLevel
from swarmz_runtime.intelligence.worldspace import (
    WorldSpace,
    WorldSpaceEntry,
    SynthesisArtifact,
    get_world_space,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _entry(
    subject: str = "Test Subject",
    scale: ScaleLevel = ScaleLevel.HUMAN,
    content: str = "Test content about the subject.",
    depth: str = "DEEP",
    tags: list[str] | None = None,
    entry_id: str | None = None,
) -> WorldSpaceEntry:
    return WorldSpaceEntry(
        entry_id=entry_id or uuid.uuid4().hex[:16],
        subject=subject,
        scale=scale,
        content=content,
        connections=[],
        timestamp=datetime.now(timezone.utc).isoformat(),
        operator="Regan Harris",
        tags=tags or [],
        depth=depth,
    )


@pytest.fixture
def ws(tmp_path: Path) -> WorldSpace:
    return WorldSpace(artifacts_dir=tmp_path / "worldspace")


# ---------------------------------------------------------------------------
# WorldSpaceEntry
# ---------------------------------------------------------------------------

def test_entry_to_dict_keys():
    e = _entry()
    d = e.to_dict()
    assert "entry_id" in d
    assert "subject" in d
    assert "scale" in d
    assert "content" in d
    assert "connections" in d
    assert "operator" in d
    assert d["operator"] == "Regan Harris"


def test_entry_from_dict_roundtrip():
    e = _entry(subject="Stars", scale=ScaleLevel.STELLAR, depth="PROFOUND")
    recovered = WorldSpaceEntry.from_dict(e.to_dict())
    assert recovered.entry_id == e.entry_id
    assert recovered.subject == "Stars"
    assert recovered.scale == ScaleLevel.STELLAR
    assert recovered.depth == "PROFOUND"


def test_entry_scale_stored_as_string():
    e = _entry(scale=ScaleLevel.COSMIC)
    d = e.to_dict()
    assert d["scale"] == "cosmic"


# ---------------------------------------------------------------------------
# WorldSpace.add()
# ---------------------------------------------------------------------------

def test_add_creates_json_file(ws: WorldSpace, tmp_path: Path):
    e = _entry()
    eid = ws.add(e)
    assert eid == e.entry_id
    assert (tmp_path / "worldspace" / f"{eid}.json").exists()


def test_add_returns_entry_id(ws: WorldSpace):
    e = _entry()
    result = ws.add(e)
    assert result == e.entry_id


def test_add_multiple_entries(ws: WorldSpace):
    ids = [ws.add(_entry()) for _ in range(5)]
    assert len(set(ids)) == 5


def test_add_is_additive(ws: WorldSpace):
    """Adding same entry_id again overwrites in-place (additive update)."""
    e = _entry(entry_id="fixed_id_001")
    ws.add(e)
    ws.add(e)  # second add should not raise
    loaded = ws.get("fixed_id_001")
    assert loaded is not None


# ---------------------------------------------------------------------------
# WorldSpace.get()
# ---------------------------------------------------------------------------

def test_get_returns_entry(ws: WorldSpace):
    e = _entry(subject="Quantum Foam")
    ws.add(e)
    loaded = ws.get(e.entry_id)
    assert loaded is not None
    assert loaded.subject == "Quantum Foam"


def test_get_returns_none_for_unknown(ws: WorldSpace):
    assert ws.get("nonexistent_entry_id") is None


# ---------------------------------------------------------------------------
# WorldSpace.search()
# ---------------------------------------------------------------------------

def test_search_finds_by_subject(ws: WorldSpace):
    ws.add(_entry(subject="Black Holes and Singularities"))
    results = ws.search("Singularities")
    assert any("Singularities" in r.subject for r in results)


def test_search_finds_by_content(ws: WorldSpace):
    ws.add(_entry(content="The Milky Way contains 200 billion stars."))
    results = ws.search("200 billion")
    assert len(results) >= 1


def test_search_scale_filter(ws: WorldSpace):
    ws.add(_entry(subject="Quantum Entanglement", scale=ScaleLevel.QUANTUM))
    ws.add(_entry(subject="Galaxy Formation", scale=ScaleLevel.GALACTIC))
    quantum_results = ws.search("", scale=ScaleLevel.QUANTUM)
    assert all(r.scale == ScaleLevel.QUANTUM for r in quantum_results)


def test_search_returns_empty_on_no_match(ws: WorldSpace):
    ws.add(_entry(subject="Mars Geology"))
    results = ws.search("zzz_nonexistent_keyword_zzz")
    assert results == []


def test_search_case_insensitive(ws: WorldSpace):
    ws.add(_entry(subject="Dark Matter Distribution"))
    results = ws.search("dark matter")
    assert len(results) >= 1


# ---------------------------------------------------------------------------
# WorldSpace.connect()
# ---------------------------------------------------------------------------

def test_connect_creates_edge(ws: WorldSpace):
    e1 = _entry(subject="Gravity")
    e2 = _entry(subject="Space-Time")
    ws.add(e1)
    ws.add(e2)
    result = ws.connect(e1.entry_id, e2.entry_id, "caused_by")
    assert result["ok"] is True
    assert "edge" in result


def test_connect_updates_both_entries(ws: WorldSpace):
    e1 = _entry()
    e2 = _entry()
    ws.add(e1)
    ws.add(e2)
    ws.connect(e1.entry_id, e2.entry_id, "relates_to")
    loaded1 = ws.get(e1.entry_id)
    loaded2 = ws.get(e2.entry_id)
    assert e2.entry_id in (loaded1.connections if loaded1 else [])
    assert e1.entry_id in (loaded2.connections if loaded2 else [])


def test_connect_writes_graph_log(ws: WorldSpace, tmp_path: Path):
    e1 = _entry()
    e2 = _entry()
    ws.add(e1)
    ws.add(e2)
    ws.connect(e1.entry_id, e2.entry_id, "precedes")
    graph_log = tmp_path / "worldspace" / "_graph.jsonl"
    assert graph_log.exists()
    assert graph_log.stat().st_size > 0


# ---------------------------------------------------------------------------
# WorldSpace.synthesize()
# ---------------------------------------------------------------------------

def test_synthesize_returns_artifact(ws: WorldSpace):
    e1 = _entry(subject="The Sun", scale=ScaleLevel.STELLAR)
    e2 = _entry(subject="Nuclear Fusion", scale=ScaleLevel.QUANTUM)
    ws.add(e1)
    ws.add(e2)
    result = ws.synthesize([e1.entry_id, e2.entry_id])
    assert isinstance(result, SynthesisArtifact)
    assert result.entry_count == 2


def test_synthesize_includes_subjects(ws: WorldSpace):
    e = _entry(subject="Entropy and Time")
    ws.add(e)
    result = ws.synthesize([e.entry_id])
    assert "Entropy and Time" in result.synthesis


def test_synthesize_empty_ids_returns_gracefully(ws: WorldSpace):
    result = ws.synthesize(["nonexistent_id_xyz"])
    assert isinstance(result, SynthesisArtifact)
    assert result.entry_count == 0


def test_synthesize_to_dict(ws: WorldSpace):
    e = _entry()
    ws.add(e)
    result = ws.synthesize([e.entry_id])
    d = result.to_dict()
    assert "synthesis" in d
    assert "entry_count" in d
    assert "render_url" in d


# ---------------------------------------------------------------------------
# WorldSpace.map()
# ---------------------------------------------------------------------------

def test_map_returns_nodes_and_edges(ws: WorldSpace):
    ws.add(_entry(subject="Alpha"))
    ws.add(_entry(subject="Beta"))
    graph = ws.map()
    assert "nodes" in graph
    assert "edges" in graph
    assert graph["node_count"] >= 2


def test_map_empty_worldspace(ws: WorldSpace):
    graph = ws.map()
    assert graph["node_count"] == 0
    assert graph["edge_count"] == 0


# ---------------------------------------------------------------------------
# WorldSpace.export()
# ---------------------------------------------------------------------------

def test_export_includes_all_entries(ws: WorldSpace):
    for i in range(3):
        ws.add(_entry(subject=f"Entry {i}"))
    exported = ws.export()
    assert exported["entry_count"] == 3
    assert len(exported["entries"]) == 3


def test_export_includes_operator(ws: WorldSpace):
    ws.add(_entry())
    exported = ws.export()
    assert exported["operator"] == "Regan Harris"


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

def test_get_world_space_singleton():
    w1 = get_world_space()
    w2 = get_world_space()
    assert w1 is w2
