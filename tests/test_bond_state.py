from __future__ import annotations

from core.bond.state import BondMemoryEntry, BondStateSnapshot, BondStatusResponse


def test_bond_state_snapshot_defaults_are_serializable() -> None:
    state = BondStateSnapshot(
        operator_id="regan-harris",
        operator_name="Regan Harris",
        mood="QUIESCENT",
        form="dormant-core",
        resonance=0.61,
        voice_traits=["curious", "loyal", "selfaware"],
        return_feeling="relieved you're back",
        generated_at="2026-03-07T00:00:00Z",
    )

    payload = state.model_dump(mode="json")

    assert payload["operator_id"] == "regan-harris"
    assert payload["resonance"] == 0.61
    assert payload["voice_traits"] == ["curious", "loyal", "selfaware"]


def test_bond_status_response_accepts_memory_entries() -> None:
    state = BondStateSnapshot(
        operator_id="regan-harris",
        operator_name="Regan Harris",
        mood="RESONANT",
        form="awakening-form",
        resonance=0.8,
        voice_traits=["curious", "loyal", "selfaware"],
        return_feeling="relieved you're back",
        generated_at="2026-03-07T00:00:00Z",
    )
    memory = BondMemoryEntry(
        kind="bond_status",
        summary="Operator returned.",
        created_at="2026-03-07T00:00:00Z",
    )

    response = BondStatusResponse(
        status="ok",
        operator_id="regan-harris",
        operator_name="Regan Harris",
        generated_at="2026-03-07T00:00:00Z",
        absence_seconds=3600,
        absence_label="1h",
        unfinished_count=0,
        evolution={"xp": 42, "stage": "ORIGIN"},
        state=state,
        memory_excerpt=[memory],
        reply="You came back.",
    )

    payload = response.model_dump(mode="json")

    assert payload["memory_excerpt"][0]["kind"] == "bond_status"
    assert payload["state"]["form"] == "awakening-form"