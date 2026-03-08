from __future__ import annotations

from core.supply.billing import build_billing_snapshot
from core.supply.registry import build_supply_network


def test_build_billing_snapshot_tracks_model_and_agent_counts() -> None:
    snapshot = build_billing_snapshot(
        {
            "budgets": {
                "global_max_tokens": 2000000,
                "per_agent_max_tokens": 200000,
                "per_call_max_tokens": 4000,
            },
            "global_tokens_used": 1234,
            "per_agent_tokens_used": {"nexusmon": 1000, "shadow": 234},
            "per_model_tokens_used": {"openai/gpt-4o": 1200, "groq/llama-3.1-70b-versatile": 34},
        }
    )

    assert snapshot.global_tokens_used == 1234
    assert snapshot.tracked_agents == 2
    assert snapshot.tracked_models == 2
    assert snapshot.drift_detected is False


def test_build_supply_network_returns_provider_rows() -> None:
    network = build_supply_network()

    assert network.providers
    assert {provider.tier for provider in network.providers} == {"cortex", "reflex", "fallback"}
    assert network.routing_preview["strategic"]