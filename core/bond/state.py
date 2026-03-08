from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class BondMemoryEntry(BaseModel):
    kind: str
    summary: str
    created_at: str
    payload: dict[str, Any] = Field(default_factory=dict)


class BondStateSnapshot(BaseModel):
    operator_id: str
    operator_name: str
    mood: str
    form: str
    resonance: float
    voice_traits: list[str] = Field(default_factory=list)
    return_feeling: str = ""
    last_seen_at: str | None = None
    generated_at: str


class BondStatusResponse(BaseModel):
    status: str
    operator_id: str
    operator_name: str
    generated_at: str
    absence_seconds: int
    absence_label: str
    unfinished_count: int
    unfinished_missions: list[dict[str, Any]] = Field(default_factory=list)
    memory_excerpt: list[BondMemoryEntry] = Field(default_factory=list)
    conversation_excerpt: list[dict[str, str]] = Field(default_factory=list)
    evolution: dict[str, Any] = Field(default_factory=dict)
    state: BondStateSnapshot
    reply: str | None = None
    error: str | None = None
    model_used: str | None = None
    provider: str | None = None
    tokens_used: int = 0
    latency_ms: float = 0.0