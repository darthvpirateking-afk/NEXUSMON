"""NEXUSMON Trait registry. Traits only increase — additive law."""

from __future__ import annotations

from dataclasses import dataclass

from .stage import STAGE_DEFS, STAGE_ORDER, EvolutionStage


@dataclass
class TraitDefinition:
    name: str
    unlock_stage: EvolutionStage
    evolution_multiplier: float


TRAIT_REGISTRY: dict[str, TraitDefinition] = {
    "curiosity": TraitDefinition("curiosity", EvolutionStage.ORIGIN, 1.10),
    "loyalty": TraitDefinition("loyalty", EvolutionStage.ORIGIN, 1.05),
    "aggression": TraitDefinition("aggression", EvolutionStage.EMBODIMENT, 1.20),
    "patience": TraitDefinition("patience", EvolutionStage.EMBODIMENT, 1.10),
    "creativity": TraitDefinition("creativity", EvolutionStage.EXECUTION_FRAME, 1.30),
    "autonomy": TraitDefinition("autonomy", EvolutionStage.EXECUTION_FRAME, 1.25),
    "protectiveness": TraitDefinition("protectiveness", EvolutionStage.MONARCH_SHELL, 1.40),
}


def unlocked_traits(stage: EvolutionStage) -> list[str]:
    """Return all trait names unlocked at or before the given stage."""
    stage_idx = STAGE_ORDER.index(stage)
    result: list[str] = []
    for i in range(stage_idx + 1):
        result.extend(STAGE_DEFS[STAGE_ORDER[i]].traits_unlocked)
    return result


def apply_trait_gain(
    trait_scores: dict[str, float],
    stage: EvolutionStage,
    base_gain: float,
) -> dict[str, float]:
    """Award trait points to all unlocked traits. Traits never decrease."""
    updated = dict(trait_scores)
    for name in unlocked_traits(stage):
        tdef = TRAIT_REGISTRY.get(name)
        if tdef is None:
            continue
        gain = base_gain * tdef.evolution_multiplier
        current = updated.get(name, 0.0)
        updated[name] = min(100.0, current + gain)
    return updated
