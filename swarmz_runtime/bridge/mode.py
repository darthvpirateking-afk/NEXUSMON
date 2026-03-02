"""Hard mode-to-tier mapping for NEXUSMON bridge routing."""

from __future__ import annotations

from enum import Enum

from .config import Tier


class NexusmonMode(str, Enum):
    STRATEGIC = "strategic"
    COMBAT = "combat"
    GUARDIAN = "guardian"


_MODE_TIER: dict[NexusmonMode, Tier | None] = {
    NexusmonMode.STRATEGIC: "cortex",
    NexusmonMode.COMBAT: "reflex",
    NexusmonMode.GUARDIAN: None,
}


class GuardianCallBlocked(RuntimeError):
    """Raised when a guarded mode attempts to initiate an LLM call."""


def resolve_tier(mode: NexusmonMode | str) -> Tier:
    """Resolve mode to bridge tier, blocking guardian mode."""

    resolved_mode: NexusmonMode
    if isinstance(mode, str):
        try:
            resolved_mode = NexusmonMode(mode.strip().lower())
        except ValueError as exc:
            valid = ", ".join(item.value for item in NexusmonMode)
            raise ValueError(
                f"Unknown Nexusmon mode: {mode!r}. Valid modes: {valid}"
            ) from exc
    else:
        resolved_mode = mode

    tier = _MODE_TIER[resolved_mode]
    if tier is None:
        raise GuardianCallBlocked(
            "Guardian mode does not initiate LLM calls. "
            "Use strategic or combat mode."
        )
    return tier
