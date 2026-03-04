"""In-memory cost tracker and hard budget gate for bridge calls."""

from __future__ import annotations

import threading
from collections.abc import Callable
from typing import Any

from .config import get_budget_config

# Hard per-mode token ceilings — enforced before provider dispatch
_MODE_TOKEN_LIMITS: dict[str, int] = {
    "strategic": 4096,
    "combat": 2048,
    "guardian": 0,
    "reflex": 2048,
    "cortex": 4096,
    "fallback": 4096,
}


def get_mode_token_limit(mode: str | None) -> int:
    """Return the maximum tokens allowed for a given mode/tier.

    Returns 0 (fully blocked) for guardian. Returns a large sentinel (99999)
    for unknown/None modes so they are not artificially capped.
    """
    if mode is None:
        return 99999
    return _MODE_TOKEN_LIMITS.get(str(mode).lower().strip(), 99999)


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

    def preflight_check(
        self,
        agent_id: str,
        requested_tokens: int,
        mode: str | None = None,
    ) -> None:
        """Validate call budget before dispatching provider request."""

        # Per-mode hard ceiling check (e.g. guardian=0 blocks all calls)
        mode_limit = get_mode_token_limit(mode)
        if requested_tokens > mode_limit:
            raise BudgetExceededError(
                f"Mode token budget exceeded for '{mode}': {requested_tokens} > {mode_limit}."
            )

        budgets = self._budget_provider()
        per_call_limit = int(budgets.get("per_call_max_tokens", 0))
        per_agent_limit = int(budgets.get("per_agent_max_tokens", 0))
        global_limit = int(budgets.get("global_max_tokens", 0))

        if requested_tokens < 1:
            raise BudgetExceededError(f"Requested tokens must be >= 1, got {requested_tokens}.")
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
