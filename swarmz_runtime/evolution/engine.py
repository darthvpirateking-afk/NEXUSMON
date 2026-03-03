"""NEXUSMON Evolution Engine — XP, stage advancement, persistence.

All operations are additive. Nothing is ever removed.
State is persisted to artifacts/evolution/{agent_id}.json.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict

from .stage import EvolutionStage, EvolutionState, STAGE_DEFS, STAGE_ORDER
from .traits import apply_trait_gain

_LOCK = threading.Lock()
_STATES: Dict[str, EvolutionState] = {}
_ARTIFACTS_DIR = Path("artifacts/evolution")


def _state_path(agent_id: str) -> Path:
    return _ARTIFACTS_DIR / f"{agent_id}.json"


def _load_state(agent_id: str) -> EvolutionState:
    path = _state_path(agent_id)
    if path.exists():
        try:
            data = json.loads(path.read_text())
            return EvolutionState(
                agent_id=agent_id,
                stage=EvolutionStage(data.get("stage", "ORIGIN")),
                xp=data.get("xp", 0),
                trait_scores=data.get("trait_scores", {}),
                history=data.get("history", []),
            )
        except Exception:
            pass
    return EvolutionState(agent_id=agent_id)


def _persist(state: EvolutionState) -> None:
    _ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    path = _state_path(state.agent_id)
    path.write_text(
        json.dumps({
            "agent_id": state.agent_id,
            "stage": state.stage.value,
            "xp": state.xp,
            "trait_scores": state.trait_scores,
            "history": state.history,
        })
    )


def get_state(agent_id: str) -> EvolutionState:
    """Return current EvolutionState, loading from disk if not cached."""
    with _LOCK:
        if agent_id not in _STATES:
            _STATES[agent_id] = _load_state(agent_id)
        return _STATES[agent_id]


def advance_stage(agent_id: str) -> bool:
    """Advance agent to next stage if eligible. Additive — no traits or history removed."""
    with _LOCK:
        state = _STATES.get(agent_id)
        if not state:
            return False
        current_idx = STAGE_ORDER.index(state.stage)
        if current_idx >= len(STAGE_ORDER) - 1:
            return False
        new_stage = STAGE_ORDER[current_idx + 1]
        state.stage = new_stage
        state.history.append({
            "event": "stage_advance",
            "stage": new_stage.value,
            "xp_at_advance": state.xp,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        _persist(state)
    return True


def _check_advance(agent_id: str) -> None:
    """Advance stage if XP threshold reached. Recursive until no more advances."""
    with _LOCK:
        state = _STATES.get(agent_id)
        if not state:
            return
        current_idx = STAGE_ORDER.index(state.stage)
        if current_idx >= len(STAGE_ORDER) - 1:
            return
        next_stage = STAGE_ORDER[current_idx + 1]
        next_threshold = STAGE_DEFS[next_stage].xp_threshold
        if state.xp < next_threshold:
            return
    # Advance outside inner lock scope, then re-check for multi-stage jumps
    if advance_stage(agent_id):
        _check_advance(agent_id)


def award_xp(agent_id: str, amount: int, source: str) -> EvolutionState:
    """Award XP to agent, grow traits, check stage advance. All additive."""
    if amount <= 0:
        return get_state(agent_id)

    with _LOCK:
        if agent_id not in _STATES:
            _STATES[agent_id] = _load_state(agent_id)
        state = _STATES[agent_id]
        state.xp += amount
        state.history.append({
            "event": "xp_awarded",
            "amount": amount,
            "source": source,
            "total_xp": state.xp,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        state.trait_scores = apply_trait_gain(
            state.trait_scores, state.stage, amount / 100.0
        )
        _persist(state)

    _check_advance(agent_id)
    return get_state(agent_id)
