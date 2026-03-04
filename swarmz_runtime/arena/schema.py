"""
arena/schema.py – Pydantic models for ARENA v0.1.

Defines ArenaCandidate, ArenaRun, and ArenaConfig data contracts.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ArenaRunStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class CandidateStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    SCORED = "scored"
    FAILED = "failed"


class ArenaCandidate(BaseModel):
    """A single candidate entry in an arena run."""

    id: str
    run_id: str
    worker_index: int
    prompt: str
    response: str = ""
    score: float = 0.0
    rank: int = 0
    status: CandidateStatus = CandidateStatus.PENDING
    metadata: dict[str, Any] = Field(default_factory=dict)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None


class ArenaRun(BaseModel):
    """A single arena run with N candidates."""

    id: str
    prompt: str
    num_candidates: int = Field(ge=1, le=8)
    scoring_strategy: str = "length_quality"
    status: ArenaRunStatus = ArenaRunStatus.PENDING
    winner_id: str | None = None
    candidates: list[str] = Field(default_factory=list)  # candidate ids
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: datetime | None = None
    config_snapshot: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class ArenaConfig(BaseModel):
    """Configuration for arena runs."""

    max_candidates: int = Field(default=8, ge=1, le=8)
    default_num_candidates: int = Field(default=3, ge=1, le=8)
    scoring_strategy: str = "length_quality"
    timeout_seconds: float = 30.0
    enabled: bool = True
