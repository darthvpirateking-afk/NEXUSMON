from __future__ import annotations

from .models import BillingSnapshot


def build_billing_snapshot(cost_snapshot: dict) -> BillingSnapshot:
    budgets = dict(cost_snapshot.get("budgets", {})) if isinstance(cost_snapshot, dict) else {}
    per_agent = dict(cost_snapshot.get("per_agent_tokens_used", {})) if isinstance(cost_snapshot, dict) else {}
    per_model = dict(cost_snapshot.get("per_model_tokens_used", {})) if isinstance(cost_snapshot, dict) else {}
    global_used = int(cost_snapshot.get("global_tokens_used", 0)) if isinstance(cost_snapshot, dict) else 0
    global_max = int(budgets.get("global_max_tokens", 0))
    drift_detected = bool(global_used > global_max) if global_max else False
    return BillingSnapshot(
        global_tokens_used=global_used,
        global_max_tokens=global_max,
        per_agent_max_tokens=int(budgets.get("per_agent_max_tokens", 0)),
        per_call_max_tokens=int(budgets.get("per_call_max_tokens", 0)),
        tracked_agents=len(per_agent),
        tracked_models=len(per_model),
        drift_detected=drift_detected,
    )