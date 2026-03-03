"""
NEXUSMON LLM Bridge - canonical model routing layer.
All LLM calls pass through this module.
Operator-configurable via config/runtime.json.
"""

from __future__ import annotations

import hashlib
import importlib
import logging
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any

from .config import (
    Tier,
    build_litellm_model,
    get_fallback_chain,
    resolve_provider_api_key,
)
from .cost import get_cost_tracker
from .mode import NexusmonMode, resolve_tier

logger = logging.getLogger("swarmz.bridge.llm")
_LITELLM_MODULE: Any | None = None

_TIER_BY_INDEX: dict[int, Tier] = {1: "cortex", 2: "reflex", 3: "fallback"}
_INDEX_BY_TIER: dict[Tier, int] = {"cortex": 1, "reflex": 2, "fallback": 3}
_CIRCUIT_FAILURE_THRESHOLD = 5
_CIRCUIT_RECOVERY_SECONDS = 60.0


@dataclass(frozen=True)
class BridgeResponse:
    content: str
    model_used: str
    provider: str
    tokens_used: int
    tier: int
    latency_ms: float


@dataclass
class _CircuitState:
    failures: int = 0
    opened_at: float | None = None


class _CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = _CIRCUIT_FAILURE_THRESHOLD,
        recovery_seconds: float = _CIRCUIT_RECOVERY_SECONDS,
    ) -> None:
        self._failure_threshold = int(failure_threshold)
        self._recovery_seconds = float(recovery_seconds)
        self._lock = threading.RLock()
        self._states: dict[str, _CircuitState] = {}

    def _state_for(self, model_key: str) -> _CircuitState:
        state = self._states.get(model_key)
        if state is None:
            state = _CircuitState()
            self._states[model_key] = state
        return state

    def is_open(self, model_key: str) -> bool:
        with self._lock:
            state = self._state_for(model_key)
            if state.opened_at is None:
                return False
            elapsed = time.monotonic() - state.opened_at
            if elapsed >= self._recovery_seconds:
                return False
            return True

    def record_failure(self, model_key: str) -> None:
        with self._lock:
            state = self._state_for(model_key)
            state.failures += 1
            if state.failures >= self._failure_threshold:
                state.opened_at = time.monotonic()

    def record_success(self, model_key: str) -> None:
        with self._lock:
            self._states[model_key] = _CircuitState()

    def snapshot(self) -> dict[str, dict[str, Any]]:
        with self._lock:
            return {
                key: {
                    "failures": state.failures,
                    "open": state.opened_at is not None
                    and (time.monotonic() - state.opened_at) < self._recovery_seconds,
                    "opened_at": state.opened_at,
                }
                for key, state in self._states.items()
            }

    def reset(self) -> None:
        with self._lock:
            self._states.clear()


_CIRCUIT = _CircuitBreaker()


class _ResponseCache:
    """In-memory LRU cache for bridge responses (combat/reflex tier only)."""

    def __init__(self, maxsize: int = 256) -> None:
        self._maxsize = maxsize
        self._cache: OrderedDict[str, "BridgeResponse"] = OrderedDict()
        self._lock = threading.Lock()

    def _key(self, prompt: str, tier: str, system: str | None) -> str:
        raw = f"{tier}\x00{system or ''}\x00{prompt}"
        return hashlib.sha256(raw.encode()).hexdigest()[:32]

    def get(self, prompt: str, tier: str, system: str | None) -> "BridgeResponse | None":
        k = self._key(prompt, tier, system)
        with self._lock:
            if k in self._cache:
                self._cache.move_to_end(k)
                return self._cache[k]
        return None

    def put(self, prompt: str, tier: str, system: str | None, resp: "BridgeResponse") -> None:
        k = self._key(prompt, tier, system)
        with self._lock:
            self._cache[k] = resp
            self._cache.move_to_end(k)
            if len(self._cache) > self._maxsize:
                self._cache.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        with self._lock:
            return len(self._cache)


_RESPONSE_CACHE = _ResponseCache(maxsize=256)


def _get_litellm_module() -> Any:
    global _LITELLM_MODULE
    if _LITELLM_MODULE is None:
        _LITELLM_MODULE = importlib.import_module("litellm")
    return _LITELLM_MODULE


def _build_messages(prompt: str, system: str | None) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return messages


def _extract_content(response: Any) -> str:
    if isinstance(response, dict):
        choices = response.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    content = message.get("content")
                    if isinstance(content, str):
                        return content

    choices = getattr(response, "choices", None)
    if isinstance(choices, list) and choices:
        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", None)
        if isinstance(content, str):
            return content

    return ""


def _extract_total_tokens(response: Any) -> int:
    if isinstance(response, dict):
        usage = response.get("usage", {})
        if isinstance(usage, dict):
            value = usage.get("total_tokens")
            if isinstance(value, int):
                return value
    usage = getattr(response, "usage", None)
    if usage is not None:
        value = getattr(usage, "total_tokens", None)
        if isinstance(value, int):
            return value
    return 0


def _coerce_tier(tier: int | Tier) -> Tier:
    if isinstance(tier, int):
        return _TIER_BY_INDEX.get(tier, "cortex")
    return tier


def _resolve_model_candidate(candidate: dict[str, Any], model: str) -> tuple[str, str]:
    provider = str(candidate.get("provider", "")).strip().lower()
    selected_model = str(candidate.get("model", "")).strip()
    if model and model != "auto":
        if "/" in model:
            explicit_provider, explicit_model = model.split("/", 1)
            provider = explicit_provider.strip().lower()
            selected_model = explicit_model.strip()
        else:
            selected_model = model.strip()
    return provider, selected_model


def _candidate_label(candidate: dict[str, Any]) -> str:
    provider = str(candidate.get("provider", "unknown")).strip().lower()
    model = str(candidate.get("model", "unknown")).strip()
    return f"{provider}/{model}"


def _completion_attempt(
    candidate: dict[str, Any],
    messages: list[dict[str, str]],
    max_tokens: int,
    temperature: float,
    kwargs: dict[str, Any],
) -> str:
    provider = str(candidate.get("provider", "")).strip().lower()
    model = str(candidate.get("model", "")).strip()
    if not provider:
        raise ValueError("Missing provider in tier configuration")
    if not model:
        raise ValueError("Missing model in tier configuration")

    litellm_model = build_litellm_model(provider, model)
    api_key = resolve_provider_api_key(provider, candidate)
    if not api_key:
        api_key = candidate.get("api_key")
        if api_key is not None:
            api_key = str(api_key)

    call_kwargs = dict(kwargs)
    if api_key:
        call_kwargs.setdefault("api_key", api_key)

    response = _get_litellm_module().completion(
        model=litellm_model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        **call_kwargs,
    )
    return _extract_content(response)


async def _acompletion_attempt(
    candidate: dict[str, Any],
    messages: list[dict[str, str]],
    max_tokens: int,
    temperature: float,
    kwargs: dict[str, Any],
) -> str:
    provider = str(candidate.get("provider", "")).strip().lower()
    model = str(candidate.get("model", "")).strip()
    if not provider:
        raise ValueError("Missing provider in tier configuration")
    if not model:
        raise ValueError("Missing model in tier configuration")

    litellm_model = build_litellm_model(provider, model)
    api_key = resolve_provider_api_key(provider, candidate)
    if not api_key:
        api_key = candidate.get("api_key")
        if api_key is not None:
            api_key = str(api_key)

    call_kwargs = dict(kwargs)
    if api_key:
        call_kwargs.setdefault("api_key", api_key)

    response = await _get_litellm_module().acompletion(
        model=litellm_model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        **call_kwargs,
    )
    return _extract_content(response)


def _call_with_fallback(
    prompt: str,
    tier: Tier,
    system: str | None,
    max_tokens: int,
    temperature: float,
    kwargs: dict[str, Any],
) -> str:
    messages = _build_messages(prompt, system)
    failures: list[str] = []

    for candidate in get_fallback_chain(tier):
        label = _candidate_label(candidate)
        try:
            content = _completion_attempt(
                candidate=candidate,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                kwargs=kwargs,
            )
            if content:
                return content
            failures.append(f"{label} (empty content)")
        except Exception as exc:  # pragma: no cover - exercised in fallback tests
            logger.warning("[NEXUSMON WARN] LLM attempt failed for %s: %s", label, exc)
            failures.append(f"{label} ({exc})")

    details = "; ".join(failures) if failures else "no candidates available"
    raise RuntimeError(f"LLM call failed after fallback chain: {details}")


async def _acall_with_fallback(
    prompt: str,
    tier: Tier,
    system: str | None,
    max_tokens: int,
    temperature: float,
    kwargs: dict[str, Any],
) -> str:
    messages = _build_messages(prompt, system)
    failures: list[str] = []

    for candidate in get_fallback_chain(tier):
        label = _candidate_label(candidate)
        try:
            content = await _acompletion_attempt(
                candidate=candidate,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                kwargs=kwargs,
            )
            if content:
                return content
            failures.append(f"{label} (empty content)")
        except Exception as exc:  # pragma: no cover - exercised in fallback tests
            logger.warning("[NEXUSMON WARN] LLM attempt failed for %s: %s", label, exc)
            failures.append(f"{label} ({exc})")

    details = "; ".join(failures) if failures else "no candidates available"
    raise RuntimeError(f"LLM call failed after fallback chain: {details}")


def call(
    prompt: str,
    tier: Tier = "cortex",
    system: str | None = None,
    max_tokens: int = 2048,
    temperature: float = 0.3,
    **kwargs: Any,
) -> str:
    """Route a prompt to the configured provider chain for the requested tier."""

    result = _call_with_fallback(
        prompt=prompt,
        tier=tier,
        system=system,
        max_tokens=max_tokens,
        temperature=temperature,
        kwargs=dict(kwargs),
    )
    return str(result or "")


async def call_v2(
    prompt: str,
    model: str = "auto",
    tier: int = 1,
    context: dict[str, Any] | None = None,
    budget_tokens: int = 4000,
    mode: NexusmonMode | str | None = None,
    latency_target_ms: float | None = None,
    retry_budget: int | None = None,
) -> BridgeResponse:
    """Async typed bridge API with deterministic tiered fallback."""

    if mode is not None:
        resolved_tier = resolve_tier(mode)
    else:
        resolved_tier = _coerce_tier(tier)

    mode_str = str(mode) if mode is not None else resolved_tier

    requested_tokens = int(budget_tokens)
    system = None
    agent_id = "system"
    if isinstance(context, dict):
        system_candidate = context.get("system")
        if isinstance(system_candidate, str) and system_candidate.strip():
            system = system_candidate.strip()
        agent_candidate = context.get("agent_id")
        if isinstance(agent_candidate, str) and agent_candidate.strip():
            agent_id = agent_candidate.strip()

    get_cost_tracker().preflight_check(
        agent_id=agent_id,
        requested_tokens=requested_tokens,
        mode=mode_str,
    )

    # Cache hit — reflex/combat tier only
    if resolved_tier == "reflex":
        cached = _RESPONSE_CACHE.get(prompt, resolved_tier, system)
        if cached is not None:
            return cached

    messages = _build_messages(prompt, system)
    failures: list[str] = []
    candidates = list(get_fallback_chain(resolved_tier))
    if retry_budget is not None:
        candidates = candidates[:max(1, int(retry_budget))]
    for candidate in candidates:
        provider, selected_model = _resolve_model_candidate(candidate, model)
        if not provider or not selected_model:
            failures.append("invalid-candidate")
            continue
        label = f"{provider}/{selected_model}"
        if _CIRCUIT.is_open(label):
            failures.append(f"{label} (circuit open)")
            continue
        try:
            litellm_model = build_litellm_model(provider, selected_model)
            api_key = resolve_provider_api_key(provider, candidate) or candidate.get("api_key")
            call_kwargs: dict[str, Any] = {}
            if isinstance(api_key, str) and api_key:
                call_kwargs["api_key"] = api_key
            if provider == "vllm":
                base_url = candidate.get("base_url")
                if isinstance(base_url, str) and base_url:
                    call_kwargs["api_base"] = base_url
            start = time.perf_counter()
            response = await _get_litellm_module().acompletion(
                model=litellm_model,
                messages=messages,
                max_tokens=requested_tokens,
                **call_kwargs,
            )
            latency_ms = (time.perf_counter() - start) * 1000
            if latency_target_ms is not None and resolved_tier == "reflex" and latency_ms > latency_target_ms:
                logger.warning(
                    "[NEXUSMON WARN] reflex latency breach: %.1fms > %.1fms target (model=%s)",
                    latency_ms,
                    latency_target_ms,
                    litellm_model,
                )
            content = _extract_content(response)
            if not content:
                _CIRCUIT.record_failure(label)
                failures.append(f"{label} (empty content)")
                continue
            _CIRCUIT.record_success(label)
            tokens_used = _extract_total_tokens(response)
            get_cost_tracker().record_usage(
                agent_id=agent_id,
                model_key=label,
                tokens_used=tokens_used,
            )
            bridge_resp = BridgeResponse(
                content=content,
                model_used=litellm_model,
                provider=provider,
                tokens_used=tokens_used,
                tier=_INDEX_BY_TIER.get(resolved_tier, tier),
                latency_ms=latency_ms,
            )
            if resolved_tier == "reflex":
                _RESPONSE_CACHE.put(prompt, resolved_tier, system, bridge_resp)
            return bridge_resp
        except Exception as exc:  # pragma: no cover - fallback path tested indirectly
            _CIRCUIT.record_failure(label)
            logger.warning("[NEXUSMON WARN] LLM attempt failed for %s: %s", label, exc)
            failures.append(f"{label} ({exc})")

    details = "; ".join(failures) if failures else "no candidates available"
    raise RuntimeError(f"LLM call failed after fallback chain: {details}")


def get_bridge_status() -> dict[str, Any]:
    """Return runtime bridge status snapshot for observability."""

    return {
        "circuit": _CIRCUIT.snapshot(),
        "cost": get_cost_tracker().snapshot(),
        "response_cache": {"size": _RESPONSE_CACHE.size()},
    }


def _reset_bridge_runtime_state_for_tests() -> None:
    """Reset bridge runtime mutable state (test helper)."""

    _CIRCUIT.reset()
    get_cost_tracker().reset()
    _RESPONSE_CACHE.clear()
