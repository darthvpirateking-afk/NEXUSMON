from __future__ import annotations

import pytest

from swarmz_runtime.bridge.mode import (
    GuardianCallBlocked,
    NexusmonMode,
    resolve_tier,
)


def test_resolve_tier_valid_modes() -> None:
    assert resolve_tier(NexusmonMode.STRATEGIC) == "cortex"
    assert resolve_tier("combat") == "reflex"


def test_resolve_tier_unknown_mode_raises_value_error() -> None:
    with pytest.raises(ValueError, match="Unknown Nexusmon mode"):
        resolve_tier("invalid-mode")


def test_resolve_tier_guardian_raises_guardian_call_blocked() -> None:
    with pytest.raises(GuardianCallBlocked):
        resolve_tier("guardian")
