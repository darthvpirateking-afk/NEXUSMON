from __future__ import annotations

import asyncio
from typing import Any

import pytest

from swarmz_runtime.bridge import (
    BudgetExceededError,
    GuardianCallBlocked,
    NexusmonMode,
    llm,
)


class _LiteLLMStub:
    def __init__(self, responses: dict[str, str], failing_models: set[str] | None = None) -> None:
        self.responses = responses
        self.failing_models = failing_models or set()
        self.calls: list[dict[str, Any]] = []

    async def acompletion(self, **kwargs: Any) -> dict[str, Any]:
        self.calls.append(kwargs)
        model = str(kwargs["model"])
        if model in self.failing_models:
            raise RuntimeError(f"forced failure: {model}")
        return {
            "choices": [{"message": {"content": self.responses.get(model, "")}}],
            "usage": {"total_tokens": 33},
        }


@pytest.fixture(autouse=True)
def _reset_bridge_runtime_state() -> None:
    llm._reset_bridge_runtime_state_for_tests()
    yield
    llm._reset_bridge_runtime_state_for_tests()


def test_call_v2_returns_typed_response(monkeypatch) -> None:
    stub = _LiteLLMStub({"openai/gpt-4o": "online"})
    monkeypatch.setattr(
        llm,
        "get_fallback_chain",
        lambda _: [{"provider": "openai", "model": "gpt-4o"}],
    )
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)
    monkeypatch.setattr(llm, "resolve_provider_api_key", lambda *_: "test-key")

    result = asyncio.run(llm.call_v2("ping", tier=1, context={"system": "sys"}))

    assert result.content == "online"
    assert result.model_used == "openai/gpt-4o"
    assert result.provider == "openai"
    assert result.tokens_used == 33
    assert result.tier == 1
    assert result.latency_ms >= 0
    assert stub.calls[0]["messages"][0] == {"role": "system", "content": "sys"}


def test_call_v2_fallback_to_second_candidate(monkeypatch) -> None:
    stub = _LiteLLMStub(
        {"groq/llama-3.1-70b-versatile": "fallback-ok"},
        failing_models={"openai/gpt-4o"},
    )
    monkeypatch.setattr(
        llm,
        "get_fallback_chain",
        lambda _: [
            {"provider": "openai", "model": "gpt-4o"},
            {"provider": "groq", "model": "llama-3.1-70b-versatile"},
        ],
    )
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)
    monkeypatch.setattr(llm, "resolve_provider_api_key", lambda *_: None)

    result = asyncio.run(llm.call_v2("ping", tier=1))

    assert result.content == "fallback-ok"
    assert result.model_used == "groq/llama-3.1-70b-versatile"
    assert len(stub.calls) == 2


def test_call_v2_mode_strategic_forces_cortex(monkeypatch) -> None:
    stub = _LiteLLMStub({"openai/gpt-4o": "strategic-ok"})
    seen_tier: dict[str, str] = {}

    def _chain(tier: str) -> list[dict[str, str]]:
        seen_tier["tier"] = tier
        return [{"provider": "openai", "model": "gpt-4o"}]

    monkeypatch.setattr(llm, "get_fallback_chain", _chain)
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)
    monkeypatch.setattr(llm, "resolve_provider_api_key", lambda *_: None)

    result = asyncio.run(
        llm.call_v2("ping", tier=2, mode=NexusmonMode.STRATEGIC)
    )

    assert seen_tier["tier"] == "cortex"
    assert result.tier == 1
    assert result.model_used == "openai/gpt-4o"


def test_call_v2_mode_combat_forces_reflex(monkeypatch) -> None:
    stub = _LiteLLMStub({"groq/llama-3.1-70b-versatile": "combat-ok"})
    seen_tier: dict[str, str] = {}

    def _chain(tier: str) -> list[dict[str, str]]:
        seen_tier["tier"] = tier
        return [{"provider": "groq", "model": "llama-3.1-70b-versatile"}]

    monkeypatch.setattr(llm, "get_fallback_chain", _chain)
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)
    monkeypatch.setattr(llm, "resolve_provider_api_key", lambda *_: None)

    result = asyncio.run(llm.call_v2("ping", tier=1, mode="combat", budget_tokens=100))

    assert seen_tier["tier"] == "reflex"
    assert result.tier == 2
    assert result.model_used == "groq/llama-3.1-70b-versatile"


def test_call_v2_mode_guardian_blocks_without_provider_call(monkeypatch) -> None:
    stub = _LiteLLMStub({"openai/gpt-4o": "online"})
    chain_called = {"value": False}

    def _chain(_: str) -> list[dict[str, str]]:
        chain_called["value"] = True
        return [{"provider": "openai", "model": "gpt-4o"}]

    monkeypatch.setattr(llm, "get_fallback_chain", _chain)
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)

    with pytest.raises(GuardianCallBlocked):
        asyncio.run(llm.call_v2("ping", mode="guardian"))

    assert chain_called["value"] is False
    assert stub.calls == []


def test_call_v2_budget_gate_blocks_over_per_call_limit(monkeypatch) -> None:
    stub = _LiteLLMStub({"openai/gpt-4o": "online"})
    monkeypatch.setattr(
        llm,
        "get_fallback_chain",
        lambda _: [{"provider": "openai", "model": "gpt-4o"}],
    )
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)

    with pytest.raises(BudgetExceededError, match="Per-call token budget exceeded"):
        asyncio.run(llm.call_v2("ping", tier=1, budget_tokens=4001))

    assert stub.calls == []


def test_call_v2_records_usage_tokens_on_success(monkeypatch) -> None:
    stub = _LiteLLMStub({"openai/gpt-4o": "ok"})
    monkeypatch.setattr(
        llm,
        "get_fallback_chain",
        lambda _: [{"provider": "openai", "model": "gpt-4o"}],
    )
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)
    monkeypatch.setattr(llm, "resolve_provider_api_key", lambda *_: None)

    result = asyncio.run(
        llm.call_v2("ping", tier=1, context={"agent_id": "agent-7"})
    )

    status = llm.get_bridge_status()
    assert result.tokens_used == 33
    assert status["cost"]["global_tokens_used"] == 33
    assert status["cost"]["per_agent_tokens_used"]["agent-7"] == 33
    assert status["cost"]["per_model_tokens_used"]["openai/gpt-4o"] == 33


def test_call_v2_circuit_opens_and_skips_failing_model_after_threshold(
    monkeypatch,
) -> None:
    failing_model = "openai/gpt-4o"
    fallback_model = "groq/llama-3.1-70b-versatile"
    stub = _LiteLLMStub(
        {fallback_model: "fallback-ok"},
        failing_models={failing_model},
    )
    monkeypatch.setattr(
        llm,
        "get_fallback_chain",
        lambda _: [
            {"provider": "openai", "model": "gpt-4o"},
            {"provider": "groq", "model": "llama-3.1-70b-versatile"},
        ],
    )
    monkeypatch.setattr(llm, "_get_litellm_module", lambda: stub)
    monkeypatch.setattr(llm, "resolve_provider_api_key", lambda *_: None)

    for _ in range(5):
        result = asyncio.run(llm.call_v2("ping", tier=1))
        assert result.model_used == fallback_model

    stub.calls.clear()
    result = asyncio.run(llm.call_v2("ping", tier=1))

    assert result.model_used == fallback_model
    assert [call["model"] for call in stub.calls] == [fallback_model]
    assert llm.get_bridge_status()["circuit"][failing_model]["open"] is True
