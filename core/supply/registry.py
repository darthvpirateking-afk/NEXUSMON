from __future__ import annotations

from datetime import datetime, timezone

from swarmz_runtime.bridge import get_bridge_status
from swarmz_runtime.bridge.config import get_budget_config, get_routing, get_tier

from .billing import build_billing_snapshot
from .evaluator import score_provider
from .models import ProviderStatus, SupplyNetworkResponse


_ESTIMATED_COST_PER_1K = {
    "openai": 0.03,
    "groq": 0.002,
    "ollama": 0.0,
    "vllm": 0.0,
}

_COMPLIANCE = {
    "openai": "standard",
    "groq": "standard",
    "ollama": "self-hosted",
    "vllm": "self-hosted",
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _provider_modes(routing: dict[str, str], tier_name: str) -> list[str]:
    modes: list[str] = []
    if routing.get("default_tier") == tier_name:
        modes.append("strategic")
    if routing.get("swarm_tier") == tier_name:
        modes.append("combat")
    if routing.get("offline_tier") == tier_name:
        modes.append("offline")
    return modes


def _build_provider_status(tier_name: str, routing: dict[str, str], bridge_status: dict) -> ProviderStatus:
    tier_cfg = get_tier(tier_name)
    provider = str(tier_cfg.get("provider", "unknown")).strip().lower()
    model = str(tier_cfg.get("model", "unknown")).strip()
    candidate_key = f"{provider}/{model}"
    circuit = dict(bridge_status.get("circuit", {})) if isinstance(bridge_status, dict) else {}
    circuit_state = dict(circuit.get(candidate_key, {})) if isinstance(circuit.get(candidate_key, {}), dict) else {}
    configured = bool(provider and model and provider != "unknown" and model != "unknown")
    enabled = bool(tier_cfg.get("enabled", True))
    health = "healthy"
    notes: list[str] = []
    if not configured:
        health = "misconfigured"
        notes.append("Missing provider or model configuration")
    elif not enabled:
        health = "disabled"
        notes.append("Tier disabled in runtime config")
    elif bool(circuit_state.get("open", False)):
        health = "degraded"
        notes.append("Circuit breaker is open for this model")

    provider_status = ProviderStatus(
        provider=provider,
        model=model,
        tier=tier_name,
        configured=configured,
        enabled=enabled,
        routed_modes=_provider_modes(routing, tier_name),
        health=health,
        circuit_open=bool(circuit_state.get("open", False)),
        failures=int(circuit_state.get("failures", 0)),
        latency_ms=0.0,
        estimated_cost_per_1k=float(_ESTIMATED_COST_PER_1K.get(provider, 0.01)),
        compliance=_COMPLIANCE.get(provider, "unknown"),
        billing_integrity="tracked" if bridge_status.get("cost") else "unknown",
        notes=notes,
    )
    provider_status.score = score_provider(provider_status)
    return provider_status


def build_supply_network() -> SupplyNetworkResponse:
    routing = get_routing()
    budget = get_budget_config()
    bridge_status = get_bridge_status()
    providers = [
        _build_provider_status("cortex", routing, bridge_status),
        _build_provider_status("reflex", routing, bridge_status),
        _build_provider_status("fallback", routing, bridge_status),
    ]
    billing = build_billing_snapshot(dict(bridge_status.get("cost", {}), budgets=budget))
    return SupplyNetworkResponse(
        status="ok" if any(p.configured and p.enabled for p in providers) else "degraded",
        generated_at=_utc_now_iso(),
        default_tier=str(routing.get("default_tier", "cortex")),
        swarm_tier=str(routing.get("swarm_tier", "reflex")),
        offline_tier=str(routing.get("offline_tier", "fallback")),
        providers=providers,
        billing=billing,
        mode_table={"strategic": "cortex", "combat": "reflex", "guardian": "blocked"},
        routing_preview={
            "strategic": next((f"{p.provider}/{p.model}" for p in providers if p.tier == routing.get("default_tier")), "unresolved"),
            "combat": next((f"{p.provider}/{p.model}" for p in providers if p.tier == routing.get("swarm_tier")), "unresolved"),
            "offline": next((f"{p.provider}/{p.model}" for p in providers if p.tier == routing.get("offline_tier")), "unresolved"),
        },
        raw_bridge=bridge_status,
    )