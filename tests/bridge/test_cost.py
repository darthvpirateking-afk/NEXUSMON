from __future__ import annotations

import pytest

from swarmz_runtime.bridge.cost import BudgetExceededError, CostTracker


def test_preflight_blocks_agent_budget_exceeded() -> None:
    tracker = CostTracker(
        budget_provider=lambda: {
            "per_call_max_tokens": 1000,
            "per_agent_max_tokens": 120,
            "global_max_tokens": 10000,
        }
    )
    tracker.record_usage("agent-a", "openai/gpt-4o", 100)

    with pytest.raises(BudgetExceededError, match="Per-agent token budget exceeded"):
        tracker.preflight_check("agent-a", 30)


def test_preflight_blocks_global_budget_exceeded() -> None:
    tracker = CostTracker(
        budget_provider=lambda: {
            "per_call_max_tokens": 1000,
            "per_agent_max_tokens": 1000,
            "global_max_tokens": 100,
        }
    )
    tracker.record_usage("agent-a", "openai/gpt-4o", 80)

    with pytest.raises(BudgetExceededError, match="Global token budget exceeded"):
        tracker.preflight_check("agent-b", 30)


def test_record_usage_updates_global_agent_model_totals() -> None:
    tracker = CostTracker(
        budget_provider=lambda: {
            "per_call_max_tokens": 1000,
            "per_agent_max_tokens": 1000,
            "global_max_tokens": 1000,
        }
    )

    tracker.record_usage("agent-a", "openai/gpt-4o", 33)
    tracker.record_usage("agent-a", "openai/gpt-4o", 17)
    tracker.record_usage("agent-b", "groq/llama-3.1-70b-versatile", 20)

    snapshot = tracker.snapshot()
    assert snapshot["global_tokens_used"] == 70
    assert snapshot["per_agent_tokens_used"]["agent-a"] == 50
    assert snapshot["per_agent_tokens_used"]["agent-b"] == 20
    assert snapshot["per_model_tokens_used"]["openai/gpt-4o"] == 50
    assert snapshot["per_model_tokens_used"]["groq/llama-3.1-70b-versatile"] == 20


def test_snapshot_shape_stable() -> None:
    tracker = CostTracker()
    snapshot = tracker.snapshot()

    assert set(snapshot.keys()) == {
        "budgets",
        "global_tokens_used",
        "per_agent_tokens_used",
        "per_model_tokens_used",
    }
    assert isinstance(snapshot["budgets"], dict)
    assert isinstance(snapshot["global_tokens_used"], int)
    assert isinstance(snapshot["per_agent_tokens_used"], dict)
    assert isinstance(snapshot["per_model_tokens_used"], dict)
