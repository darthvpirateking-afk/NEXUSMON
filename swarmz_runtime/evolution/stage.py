"""NEXUSMON Evolution Stage definitions."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List


class EvolutionStage(str, Enum):
    ORIGIN = "ORIGIN"
    EMBODIMENT = "EMBODIMENT"
    EXECUTION_FRAME = "EXECUTION_FRAME"
    MONARCH_SHELL = "MONARCH_SHELL"
    ZERO_POINT = "ZERO_POINT"


@dataclass
class StageDefinition:
    stage: EvolutionStage
    xp_threshold: int
    traits_unlocked: List[str]
    visual_state: str


STAGE_DEFS: Dict[EvolutionStage, StageDefinition] = {
    EvolutionStage.ORIGIN: StageDefinition(
        stage=EvolutionStage.ORIGIN,
        xp_threshold=0,
        traits_unlocked=["curiosity", "loyalty"],
        visual_state="dormant-core",
    ),
    EvolutionStage.EMBODIMENT: StageDefinition(
        stage=EvolutionStage.EMBODIMENT,
        xp_threshold=500,
        traits_unlocked=["aggression", "patience"],
        visual_state="awakening-form",
    ),
    EvolutionStage.EXECUTION_FRAME: StageDefinition(
        stage=EvolutionStage.EXECUTION_FRAME,
        xp_threshold=2000,
        traits_unlocked=["creativity", "autonomy"],
        visual_state="battle-chassis",
    ),
    EvolutionStage.MONARCH_SHELL: StageDefinition(
        stage=EvolutionStage.MONARCH_SHELL,
        xp_threshold=6000,
        traits_unlocked=["protectiveness"],
        visual_state="sovereign-armor",
    ),
    EvolutionStage.ZERO_POINT: StageDefinition(
        stage=EvolutionStage.ZERO_POINT,
        xp_threshold=15000,
        traits_unlocked=[],
        visual_state="quantum-form",
    ),
}

STAGE_ORDER: List[EvolutionStage] = [
    EvolutionStage.ORIGIN,
    EvolutionStage.EMBODIMENT,
    EvolutionStage.EXECUTION_FRAME,
    EvolutionStage.MONARCH_SHELL,
    EvolutionStage.ZERO_POINT,
]


@dataclass
class EvolutionState:
    agent_id: str
    stage: EvolutionStage = EvolutionStage.ORIGIN
    xp: int = 0
    trait_scores: Dict[str, float] = field(default_factory=dict)
    history: List[Dict] = field(default_factory=list)

    def to_dict(self) -> Dict:
        stage_def = STAGE_DEFS[self.stage]
        current_idx = STAGE_ORDER.index(self.stage)
        next_stage = STAGE_ORDER[current_idx + 1] if current_idx < len(STAGE_ORDER) - 1 else None
        next_threshold = STAGE_DEFS[next_stage].xp_threshold if next_stage else None
        xp_pct = 0.0
        if next_threshold:
            current_threshold = stage_def.xp_threshold
            span = next_threshold - current_threshold
            progress = self.xp - current_threshold
            xp_pct = round(min(100.0, max(0.0, (progress / span) * 100)), 2) if span > 0 else 100.0
        return {
            "agent_id": self.agent_id,
            "stage": self.stage.value,
            "visual_state": stage_def.visual_state,
            "xp": self.xp,
            "xp_pct": xp_pct,
            "next_stage": next_stage.value if next_stage else None,
            "next_threshold": next_threshold,
            "trait_scores": self.trait_scores,
            "history": self.history[-20:],
        }
