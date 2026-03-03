"""Tests for per-mode token budget enforcement in CostTracker.preflight_check()."""
from __future__ import annotations

import pytest

from swarmz_runtime.bridge.cost import (
    BudgetExceededError,
    CostTracker,
    _MODE_TOKEN_LIMITS,
    get_mode_token_limit,
)

_GENEROUS_BUDGETS = {
    "per_call_max_tokens": 99999,
    "per_agent_max_tokens": 999999,
    "global_max_tokens": 9999999,
}


def _tracker() -> CostTracker:
    return CostTracker(budget_provider=lambda: _GENEROUS_BUDGETS)


# ── get_mode_token_limit ──────────────────────────────────────────────────────


class TestGetModeTokenLimit:
    def test_strategic_limit(self):
        assert get_mode_token_limit("strategic") == 4096

    def test_combat_limit(self):
        assert get_mode_token_limit("combat") == 2048

    def test_reflex_limit(self):
        assert get_mode_token_limit("reflex") == 2048

    def test_cortex_limit(self):
        assert get_mode_token_limit("cortex") == 4096

    def test_guardian_limit_is_zero(self):
        assert get_mode_token_limit("guardian") == 0

    def test_fallback_limit(self):
        assert get_mode_token_limit("fallback") == 4096

    def test_none_mode_returns_large_sentinel(self):
        limit = get_mode_token_limit(None)
        assert limit >= 9999

    def test_unknown_mode_returns_large_sentinel(self):
        limit = get_mode_token_limit("unknown_mode_xyz")
        assert limit >= 9999

    def test_case_insensitive(self):
        assert get_mode_token_limit("STRATEGIC") == get_mode_token_limit("strategic")
        assert get_mode_token_limit("Combat") == get_mode_token_limit("combat")

    def test_mode_limits_dict_has_expected_keys(self):
        assert "strategic" in _MODE_TOKEN_LIMITS
        assert "combat" in _MODE_TOKEN_LIMITS
        assert "guardian" in _MODE_TOKEN_LIMITS
        assert "reflex" in _MODE_TOKEN_LIMITS
        assert "cortex" in _MODE_TOKEN_LIMITS


# ── preflight_check with mode ────────────────────────────────────────────────


class TestPreflightCheckModeEnforcement:
    def test_strategic_allows_tokens_at_limit(self):
        t = _tracker()
        # Should not raise — exactly at limit
        t.preflight_check("agent1", 4096, mode="strategic")

    def test_strategic_blocks_tokens_over_limit(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError, match="strategic"):
            t.preflight_check("agent1", 4097, mode="strategic")

    def test_combat_allows_tokens_at_limit(self):
        t = _tracker()
        t.preflight_check("agent1", 2048, mode="combat")

    def test_combat_blocks_tokens_over_limit(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError, match="combat"):
            t.preflight_check("agent1", 2049, mode="combat")

    def test_guardian_blocks_all_tokens(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError, match="guardian"):
            t.preflight_check("agent1", 1, mode="guardian")

    def test_guardian_blocks_even_one_token(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError):
            t.preflight_check("agent1", 1, mode="guardian")

    def test_none_mode_does_not_add_restriction(self):
        t = _tracker()
        # Should pass mode check (sentinel is very large)
        # Will only fail if per_call or other checks kick in
        t.preflight_check("agent1", 99, mode=None)

    def test_mode_check_fires_before_per_call_check(self):
        # With a budget that has per_call=1000, combat mode limit=2048
        # Requesting 1500 should pass mode (1500 <= 2048) but fail per_call (1500 > 1000)
        tight_budget = {
            "per_call_max_tokens": 1000,
            "per_agent_max_tokens": 999999,
            "global_max_tokens": 9999999,
        }
        t = CostTracker(budget_provider=lambda: tight_budget)
        with pytest.raises(BudgetExceededError, match="Per-call"):
            t.preflight_check("agent1", 1500, mode="combat")

    def test_mode_check_fires_before_global_check(self):
        # Guardian mode should block before global limit is checked
        tight_budget = {
            "per_call_max_tokens": 99999,
            "per_agent_max_tokens": 999999,
            "global_max_tokens": 9999999,
        }
        t = CostTracker(budget_provider=lambda: tight_budget)
        with pytest.raises(BudgetExceededError, match="guardian"):
            t.preflight_check("agent1", 1, mode="guardian")

    def test_reflex_allows_tokens_at_limit(self):
        t = _tracker()
        t.preflight_check("agent1", 2048, mode="reflex")

    def test_reflex_blocks_tokens_over_limit(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError, match="reflex"):
            t.preflight_check("agent1", 2049, mode="reflex")

    def test_mode_error_message_includes_mode_name(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError) as exc_info:
            t.preflight_check("agent1", 5000, mode="strategic")
        assert "strategic" in str(exc_info.value)

    def test_mode_error_message_includes_token_counts(self):
        t = _tracker()
        with pytest.raises(BudgetExceededError) as exc_info:
            t.preflight_check("agent1", 3000, mode="combat")
        msg = str(exc_info.value)
        assert "3000" in msg
        assert "2048" in msg


# ── Backward compat — preflight_check without mode ────────────────────────────


class TestPreflightCheckBackwardCompat:
    def test_no_mode_kwarg_still_works(self):
        t = _tracker()
        # Original signature — no mode param — should still work
        t.preflight_check("agent1", 100)

    def test_no_mode_does_not_block_small_request(self):
        t = _tracker()
        t.preflight_check("agent1", 50)  # should not raise
