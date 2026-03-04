# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class MissionCategory(StrEnum):
    COIN = "coin"
    FORGE = "forge"
    LIBRARY = "library"
    SANCTUARY = "sanctuary"


class MissionStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    SUSPENDED = "suspended"


class VisibilityLevel(StrEnum):
    DIM = "dim"
    VISIBLE = "visible"
    BRIGHT = "bright"
    ULTRAVIOLET = "ultraviolet"


class Mission(BaseModel):
    id: str
    goal: str
    category: MissionCategory
    constraints: dict[str, Any] = Field(default_factory=dict)
    expiry: datetime | None = None
    status: MissionStatus = MissionStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    leverage_score: float = 0.0
    revisit_interval: int = 3600
    operator_public_key: str | None = None
    mode: str | None = None  # nexusmon operator mode: strategic | combat | guardian


class CrossLayerScores(BaseModel):
    compute_cost: float
    maintainability: float
    attention: float
    economic_value: float
    trust: float
    prediction_confidence: float


class TransactionValidation(BaseModel):
    safe: bool
    borderline: bool
    failing: bool
    requires_approval: bool
    scores: CrossLayerScores


class Omen(BaseModel):
    pattern: str
    frequency: int
    threshold: int
    action: str


class Rune(BaseModel):
    id: str
    template: dict[str, Any]
    confidence: float
    success_count: int
    created_at: datetime
    last_used: datetime


class AuditEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    event_type: str
    mission_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    visibility: VisibilityLevel = VisibilityLevel.VISIBLE


class Prophecy(BaseModel):
    failure_signature: str
    likelihood: float
    warning: str
    recommended_action: str


class MaintenanceTask(BaseModel):
    module: str
    complexity_score: float
    scheduled_at: datetime
    reason: str
