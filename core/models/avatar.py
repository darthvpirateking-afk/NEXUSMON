from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field


class Rank(str, Enum):
    DORMANT = "DORMANT"
    AWAKENING = "AWAKENING"
    ACTIVE = "ACTIVE"
    SOVEREIGN = "SOVEREIGN"
    ASCENDANT = "ASCENDANT"


class AvatarForm(str, Enum):
    BYTEWOLF = "BYTEWOLF"
    GLITCHRA = "GLITCHRA"
    SIGILDRON = "SIGILDRON"


class CapabilityFlags(BaseModel):
    can_write_artifacts: bool = False
    can_access_marketplace: bool = False
    can_trigger_evolution: bool = False
    can_spawn_subagents: bool = False
    can_access_horizon_2: bool = False
    can_self_modify: bool = False


class Avatar(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = "NEXUSMON"
    form: AvatarForm = AvatarForm.BYTEWOLF
    rank: Rank = Rank.DORMANT
    xp: int = 0
    missions_complete: int = 0
    missions_failed: int = 0
    artifacts_generated: int = 0
    capabilities: CapabilityFlags = Field(default_factory=CapabilityFlags)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    evolution_pending: bool = False
