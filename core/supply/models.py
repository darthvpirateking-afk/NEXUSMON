from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ProviderStatus(BaseModel):
    provider: str
    model: str
    tier: str
    configured: bool
    enabled: bool
    routed_modes: list[str] = Field(default_factory=list)
    health: str
    circuit_open: bool = False
    failures: int = 0
    latency_ms: float = 0.0
    estimated_cost_per_1k: float = 0.0
    compliance: str = "unknown"
    billing_integrity: str = "unknown"
    score: float = 0.0
    source: str = "runtime"
    notes: list[str] = Field(default_factory=list)


class BillingSnapshot(BaseModel):
    global_tokens_used: int = 0
    global_max_tokens: int = 0
    per_agent_max_tokens: int = 0
    per_call_max_tokens: int = 0
    tracked_agents: int = 0
    tracked_models: int = 0
    drift_detected: bool = False


class SupplyNetworkResponse(BaseModel):
    status: str
    generated_at: str
    default_tier: str
    swarm_tier: str
    offline_tier: str
    providers: list[ProviderStatus] = Field(default_factory=list)
    billing: BillingSnapshot
    mode_table: dict[str, str] = Field(default_factory=dict)
    routing_preview: dict[str, str] = Field(default_factory=dict)
    raw_bridge: dict[str, Any] = Field(default_factory=dict)