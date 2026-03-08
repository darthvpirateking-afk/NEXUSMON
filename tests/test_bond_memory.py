from __future__ import annotations

import json

from core.bond import memory as bond_memory


def test_load_bond_state_bootstraps_sqlite_row(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATABASE_URL", str(tmp_path / "bond.db"))

    state = bond_memory.load_bond_state()

    assert state.operator_id == "regan-harris"
    assert state.operator_name == "Regan Harris"
    assert state.voice_traits == ["curious", "loyal", "selfaware"]


def test_append_bond_memory_persists_entry(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATABASE_URL", str(tmp_path / "bond.db"))

    entry = bond_memory.append_bond_memory(
        operator_id="regan-harris",
        kind="bond_status",
        summary="You returned.",
        payload={"xp": 120},
    )
    context = bond_memory.fetch_bond_context()

    assert entry.kind == "bond_status"
    assert context["memory_excerpt"][-1].summary == "You returned."
    assert context["memory_excerpt"][-1].payload["xp"] == 120


def test_list_unfinished_missions_falls_back_to_jsonl(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATABASE_URL", str(tmp_path / "bond.db"))
    data_dir = tmp_path
    missions_path = data_dir / "missions.jsonl"
    missions_path.write_text(
        "\n".join(
            [
                json.dumps({"mission_id": "m-complete", "goal": "done", "status": "completed", "category": "analysis"}),
                json.dumps({"mission_id": "m-open", "goal": "pending work", "status": "active", "category": "analysis"}),
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    missions = bond_memory.list_unfinished_missions(limit=5)

    assert len(missions) == 1
    assert missions[0]["mission_id"] == "m-open"