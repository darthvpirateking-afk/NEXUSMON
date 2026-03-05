from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class MissionType(str, Enum):
    ANALYSIS = "analysis"
    TRANSFORM = "data_transform"
    ARTIFACT_GEN = "artifact_gen"
    WEBHOOK = "webhook_triggered"
    SCHEDULED = "scheduled"


class MissionStatus(str, Enum):
    PENDING = "pending"
    GOVERNANCE = "governance_check"
    RUNNING = "running"
    ROLLBACK = "rolling_back"
    COMPLETE = "complete"
    FAILED = "failed"
    QUARANTINED = "quarantined"
    DENIED = "denied"


class MissionBudget(BaseModel):
    tokens: int = 10_000
    time_seconds: int = 300


class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: MissionType
    payload: dict[str, Any]
    status: MissionStatus = MissionStatus.PENDING
    budget: MissionBudget = Field(default_factory=MissionBudget)
    operator_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    xp_awarded: int = 0
    artifact_ids: list[str] = Field(default_factory=list)
    governance_result: str | None = None
    tokens_used: int = 0
    completed_fast: bool = False
    error: str | None = None


class MissionCreate(BaseModel):
    type: MissionType
    payload: dict[str, Any]
    budget: MissionBudget | None = None
    operator_id: str | None = None


class MissionResult(BaseModel):
    mission: Mission
    success: bool
    artifact_id: str | None = None
    message: str = ""

    @classmethod
    def success_result(
        cls, mission: Mission, artifact_id: str | None = None
    ) -> MissionResult:
        return cls(mission=mission, success=True, artifact_id=artifact_id)

    @classmethod
    def denied(cls, mission: Mission) -> MissionResult:
        return cls(mission=mission, success=False, message="DENIED by governance")

    @classmethod
    def quarantined(cls, mission: Mission) -> MissionResult:
        return cls(
            mission=mission,
            success=False,
            message="QUARANTINED - operator notified",
        )

    @classmethod
    def failed(cls, mission: Mission, error: str) -> MissionResult:
        return cls(mission=mission, success=False, message=f"FAILED: {error}")
