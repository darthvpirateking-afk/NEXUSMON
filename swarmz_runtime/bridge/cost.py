"""In-memory cost tracker and hard budget gate for bridge calls."""

from __future__ import annotations

import threading
from typing import Any, Callable

from .config import get_budget_config


class BudgetExceededError(RuntimeError):
    """Raised when a bridge call exceeds configured token budget limits."""


class CostTracker:
    """Thread-safe token accounting with preflight budget checks."""

    def __init__(
        self,
        budget_provider: Callable[[], dict[str, int]] | None = None,
    ) -> None:
        self._budget_provider = budget_provider or get_budget_config
        self._lock = threading.RLock()
        self._global_tokens_used = 0
        self._per_agent_tokens_used: dict[str, int] = {}
        self._per_model_tokens_used: dict[str, int] = {}

    def preflight_check(self, agent_id: str, requested_tokens: int) -> None:
        """Validate call budget before dispatching provider request."""

        budgets = self._budget_provider()
        per_call_limit = int(budgets.get("per_call_max_tokens", 0))
        per_agent_limit = int(budgets.get("per_agent_max_tokens", 0))
        global_limit = int(budgets.get("global_max_tokens", 0))

        if requested_tokens < 1:
            raise BudgetExceededError(
                f"Requested tokens must be >= 1, got {requested_tokens}."
            )
        if requested_tokens > per_call_limit:
            raise BudgetExceededError(
                f"Per-call token budget exceeded: {requested_tokens} > {per_call_limit}."
            )

        with self._lock:
            agent_used = self._per_agent_tokens_used.get(agent_id, 0)
            if agent_used + requested_tokens > per_agent_limit:
                raise BudgetExceededError(
                    "Per-agent token budget exceeded: "
                    f"{agent_used + requested_tokens} > {per_agent_limit} "
                    f"(agent_id={agent_id})."
                )

            if self._global_tokens_used + requested_tokens > global_limit:
                raise BudgetExceededError(
                    "Global token budget exceeded: "
                    f"{self._global_tokens_used + requested_tokens} > {global_limit}."
                )

    def record_usage(self, agent_id: str, model_key: str, tokens_used: int) -> None:
        """Record successful usage accounting."""

        tokens = int(tokens_used)
        if tokens <= 0:
            return

        with self._lock:
            self._global_tokens_used += tokens
            self._per_agent_tokens_used[agent_id] = (
                self._per_agent_tokens_used.get(agent_id, 0) + tokens
            )
            self._per_model_tokens_used[model_key] = (
                self._per_model_tokens_used.get(model_key, 0) + tokens
            )

    def snapshot(self) -> dict[str, Any]:
        """Return current budget and usage snapshot."""

        with self._lock:
            return {
                "budgets": dict(self._budget_provider()),
                "global_tokens_used": self._global_tokens_used,
                "per_agent_tokens_used": dict(self._per_agent_tokens_used),
                "per_model_tokens_used": dict(self._per_model_tokens_used),
            }

    def reset(self) -> None:
        """Reset in-memory accounting state."""

        with self._lock:
            self._global_tokens_used = 0
            self._per_agent_tokens_used.clear()
            self._per_model_tokens_used.clear()


_COST_TRACKER = CostTracker()


def get_cost_tracker() -> CostTracker:
    """Return module-level cost tracker singleton."""

    return _COST_TRACKER
