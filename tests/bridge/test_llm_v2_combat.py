"""Tests for call_v2 combat protocol refinements:
- latency_target_ms warning
- retry_budget candidate slicing
- response cache (reflex tier only)
- cache isolation (cortex tier never cached)
- cache cleared by reset helper
"""
from __future__ import annotations

import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from swarmz_runtime.bridge.llm import (
    BridgeResponse,
    _RESPONSE_CACHE,
    _reset_bridge_runtime_state_for_tests,
    call_v2,
    get_bridge_status,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def _make_response(content: str = "ok", tokens: int = 10):
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message.content = content
    resp.usage.total_tokens = tokens
    return resp


_REFLEX_CHAIN = [{"provider": "openai", "model": "gpt-4o-mini"}]
_CORTEX_CHAIN = [{"provider": "openai", "model": "gpt-4o"}]


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def _reset():
    _reset_bridge_runtime_state_for_tests()
    yield
    _reset_bridge_runtime_state_for_tests()


@pytest.fixture()
def mock_reflex_chain():
    with patch(
        "swarmz_runtime.bridge.llm.get_fallback_chain",
        return_value=_REFLEX_CHAIN,
    ):
        yield


@pytest.fixture()
def mock_cortex_chain():
    with patch(
        "swarmz_runtime.bridge.llm.get_fallback_chain",
        return_value=_CORTEX_CHAIN,
    ):
        yield


@pytest.fixture()
def mock_budget():
    budget = {"per_call_max_tokens": 9999, "per_agent_max_tokens": 99999, "global_max_tokens": 999999}
    with patch("swarmz_runtime.bridge.cost.get_budget_config", return_value=budget):
        yield


# ── Response cache — reflex tier ──────────────────────────────────────────────


class TestResponseCacheReflex:
    def test_cache_miss_then_hit(self, mock_reflex_chain, mock_budget):
        acompletion = AsyncMock(return_value=_make_response("cached-content"))
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            r1 = _run(call_v2(prompt="hello", mode="combat", budget_tokens=100))
            r2 = _run(call_v2(prompt="hello", mode="combat", budget_tokens=100))

        assert r1.content == "cached-content"
        assert r2.content == "cached-content"
        # Provider called exactly once — second call was a cache hit
        assert acompletion.call_count == 1

    def test_different_prompts_not_shared(self, mock_reflex_chain, mock_budget):
        acompletion = AsyncMock(side_effect=[
            _make_response("resp-A"),
            _make_response("resp-B"),
        ])
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            r1 = _run(call_v2(prompt="alpha", mode="combat", budget_tokens=100))
            r2 = _run(call_v2(prompt="beta", mode="combat", budget_tokens=100))

        assert r1.content == "resp-A"
        assert r2.content == "resp-B"
        assert acompletion.call_count == 2

    def test_different_system_prompts_not_shared(self, mock_reflex_chain, mock_budget):
        acompletion = AsyncMock(side_effect=[
            _make_response("sys-A"),
            _make_response("sys-B"),
        ])
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            r1 = _run(call_v2(
                prompt="hello",
                mode="combat",
                budget_tokens=100,
                context={"system": "sys1"},
            ))
            r2 = _run(call_v2(
                prompt="hello",
                mode="combat",
                budget_tokens=100,
                context={"system": "sys2"},
            ))

        assert r1.content == "sys-A"
        assert r2.content == "sys-B"
        assert acompletion.call_count == 2

    def test_cache_cleared_by_reset(self, mock_reflex_chain, mock_budget):
        acompletion = AsyncMock(side_effect=[
            _make_response("first"),
            _make_response("second"),
        ])
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            _run(call_v2(prompt="hello", mode="combat", budget_tokens=100))
            _reset_bridge_runtime_state_for_tests()
            r2 = _run(call_v2(prompt="hello", mode="combat", budget_tokens=100))

        assert r2.content == "second"
        assert acompletion.call_count == 2

    def test_cache_size_in_status(self, mock_reflex_chain, mock_budget):
        acompletion = AsyncMock(return_value=_make_response("x"))
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            _run(call_v2(prompt="p1", mode="combat", budget_tokens=100))
            _run(call_v2(prompt="p2", mode="combat", budget_tokens=100))

        status = get_bridge_status()
        assert status["response_cache"]["size"] == 2


class TestResponseCacheCortexNotCached:
    def test_cortex_never_cached(self, mock_cortex_chain, mock_budget):
        acompletion = AsyncMock(side_effect=[
            _make_response("first"),
            _make_response("second"),
        ])
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            r1 = _run(call_v2(prompt="same", mode="strategic", budget_tokens=100))
            r2 = _run(call_v2(prompt="same", mode="strategic", budget_tokens=100))

        assert r1.content == "first"
        assert r2.content == "second"
        assert acompletion.call_count == 2

    def test_cortex_cache_size_stays_zero(self, mock_cortex_chain, mock_budget):
        acompletion = AsyncMock(return_value=_make_response("x"))
        litellm = MagicMock()
        litellm.acompletion = acompletion

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            _run(call_v2(prompt="anything", mode="strategic", budget_tokens=100))

        status = get_bridge_status()
        assert status["response_cache"]["size"] == 0


# ── Retry budget ──────────────────────────────────────────────────────────────


class TestRetryBudget:
    def test_retry_budget_limits_candidates(self, mock_budget):
        three_candidates = [
            {"provider": "openai", "model": "gpt-4o"},
            {"provider": "openai", "model": "gpt-4o-mini"},
            {"provider": "openai", "model": "gpt-3.5-turbo"},
        ]

        call_count = 0

        async def _fail(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise RuntimeError("provider down")

        litellm = MagicMock()
        litellm.acompletion = _fail

        with patch("swarmz_runtime.bridge.llm.get_fallback_chain", return_value=three_candidates), \
             patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            with pytest.raises(RuntimeError, match="LLM call failed"):
                _run(call_v2(prompt="x", mode="strategic", budget_tokens=100, retry_budget=2))

        assert call_count == 2  # only first 2 of 3 tried

    def test_retry_budget_one(self, mock_budget):
        two_candidates = [
            {"provider": "openai", "model": "gpt-4o"},
            {"provider": "openai", "model": "gpt-4o-mini"},
        ]

        call_count = 0

        async def _fail(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise RuntimeError("down")

        litellm = MagicMock()
        litellm.acompletion = _fail

        with patch("swarmz_runtime.bridge.llm.get_fallback_chain", return_value=two_candidates), \
             patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            with pytest.raises(RuntimeError):
                _run(call_v2(prompt="x", mode="strategic", budget_tokens=100, retry_budget=1))

        assert call_count == 1

    def test_retry_budget_none_uses_all_candidates(self, mock_budget):
        two_candidates = [
            {"provider": "openai", "model": "gpt-4o"},
            {"provider": "openai", "model": "gpt-4o-mini"},
        ]

        call_count = 0

        async def _fail(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise RuntimeError("down")

        litellm = MagicMock()
        litellm.acompletion = _fail

        with patch("swarmz_runtime.bridge.llm.get_fallback_chain", return_value=two_candidates), \
             patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            with pytest.raises(RuntimeError):
                _run(call_v2(prompt="x", mode="strategic", budget_tokens=100))

        assert call_count == 2  # all candidates tried when retry_budget=None


# ── Latency target warning ─────────────────────────────────────────────────────


class TestLatencyTargetWarning:
    def test_latency_breach_logs_warning(self, mock_reflex_chain, mock_budget, caplog):
        import time as _time

        async def _slow_completion(*args, **kwargs):
            await asyncio.sleep(0)  # yield; latency will be measured as ~0 but we monkeypatch
            return _make_response("fast")

        litellm = MagicMock()
        litellm.acompletion = AsyncMock(return_value=_make_response("fast"))

        # Patch perf_counter to simulate high latency
        call_seq = [0.0, 1.0]  # start=0, end=1 → 1000ms
        counter = iter(call_seq)
        original_perf = __import__("time").perf_counter

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm), \
             patch("swarmz_runtime.bridge.llm.time") as mock_time:
            mock_time.perf_counter.side_effect = [0.0, 1.0]  # 1000ms elapsed
            with caplog.at_level(logging.WARNING, logger="swarmz.bridge.llm"):
                _run(call_v2(
                    prompt="hello",
                    mode="combat",
                    budget_tokens=100,
                    latency_target_ms=500.0,
                ))

        assert any("reflex latency breach" in r.message for r in caplog.records)

    def test_no_warning_when_within_target(self, mock_reflex_chain, mock_budget, caplog):
        litellm = MagicMock()
        litellm.acompletion = AsyncMock(return_value=_make_response("fast"))

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm), \
             patch("swarmz_runtime.bridge.llm.time") as mock_time:
            mock_time.perf_counter.side_effect = [0.0, 0.1]  # 100ms elapsed
            with caplog.at_level(logging.WARNING, logger="swarmz.bridge.llm"):
                _run(call_v2(
                    prompt="hello",
                    mode="combat",
                    budget_tokens=100,
                    latency_target_ms=500.0,
                ))

        breach_logs = [r for r in caplog.records if "latency breach" in r.message]
        assert len(breach_logs) == 0

    def test_latency_warning_only_for_reflex_tier(self, mock_cortex_chain, mock_budget, caplog):
        litellm = MagicMock()
        litellm.acompletion = AsyncMock(return_value=_make_response("x"))

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm), \
             patch("swarmz_runtime.bridge.llm.time") as mock_time:
            mock_time.perf_counter.side_effect = [0.0, 5.0]  # 5000ms but cortex tier
            with caplog.at_level(logging.WARNING, logger="swarmz.bridge.llm"):
                _run(call_v2(
                    prompt="hello",
                    mode="strategic",
                    budget_tokens=100,
                    latency_target_ms=100.0,
                ))

        breach_logs = [r for r in caplog.records if "latency breach" in r.message]
        assert len(breach_logs) == 0


# ── BridgeResponse returned correctly ────────────────────────────────────────


class TestCallV2CombatResponse:
    def test_returns_bridge_response_type(self, mock_reflex_chain, mock_budget):
        litellm = MagicMock()
        litellm.acompletion = AsyncMock(return_value=_make_response("result", tokens=50))

        with patch("swarmz_runtime.bridge.llm._get_litellm_module", return_value=litellm):
            resp = _run(call_v2(prompt="q", mode="combat", budget_tokens=200))

        assert isinstance(resp, BridgeResponse)
        assert resp.content == "result"
        assert resp.tokens_used == 50
        assert resp.tier == 2  # reflex → tier index 2
