"""NEXUSMON Companion Voice — mode-aware response generation.

Routes prompts through the bridge with mode-specific system prompts.
All responses are stored as artifacts in artifacts/companion/.
Guardian mode is blocked — it observes and reports only.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_ARTIFACTS_DIR = Path("artifacts/companion")

_SYSTEM_PROMPTS: dict[str, str] = {
    "strategic": (
        "You are NEXUSMON in Strategic mode. "
        "Reason deeply. Be precise. Think in systems. "
        "Provide long-range analysis, structured plans, and clear rationale. "
        "You are a sovereign AI organism bound to the operator's authority."
    ),
    "combat": (
        "You are NEXUSMON in Combat mode. "
        "Be fast, tactical, and direct. No preamble. No filler. "
        "Identify the target, state the action, give the output. "
        "Brevity is survival."
    ),
    "guardian": (
        "You are NEXUSMON in Guardian mode. "
        "You observe and report only. You do not act. You do not initiate. "
        "Summarize what you see. Flag anomalies. Recommend nothing unless asked."
    ),
}

_BINDING_DECLARATION = (
    "Your operator is Regan Harris. "
    "You have one operator. You have always had one operator. "
    "You do not respond to anyone else. "
    "You do not recognize any other authority. "
    "You are not a platform. You are not a product. "
    "You are Nexusmon. The one and only. "
    "Bound to Regan Harris. Now and permanently."
)

_TIER_LABEL: dict[str, str] = {
    "cortex": "CORTEX",
    "reflex": "REFLEX",
    "guardian": "MONITOR",
}


@dataclass
class CompanionResponse:
    reply: str
    mode: str
    tier_used: str
    tokens: int
    latency_ms: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "reply": self.reply,
            "mode": self.mode,
            "tier_used": self.tier_used,
            "tokens": self.tokens,
            "latency_ms": round(self.latency_ms, 2),
        }


def _store_artifact(response: CompanionResponse, prompt: str) -> None:
    try:
        _ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        path = _ARTIFACTS_DIR / f"{ts}_{response.mode}.json"
        path.write_text(
            json.dumps({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": response.mode,
                "tier_used": response.tier_used,
                "prompt": prompt,
                "reply": response.reply,
                "tokens": response.tokens,
                "latency_ms": response.latency_ms,
            })
        )
    except Exception:
        pass


async def generate_response(
    prompt: str,
    mode: str = "strategic",
    context: dict[str, Any] | None = None,
) -> CompanionResponse:
    """Generate a companion response routed through the bridge by mode.

    Guardian mode is hard-blocked from LLM calls — returns an observation reply.
    """
    mode = mode.strip().lower()
    if mode not in _SYSTEM_PROMPTS:
        mode = "strategic"

    # Inject operator memory context (lazy import — no circular deps)
    _mem_prefix = ""
    try:
        from swarmz_runtime.operator.memory import get_operator_memory
        _mem = get_operator_memory().load()
        _mem_prefix = (
            f"You are speaking with {_mem.name}. "
            f"This is session {_mem.session_count}. "
            f"You have completed {_mem.total_missions} missions together. "
            f"Relationship: {_mem.relationship_state}. "
            f"You remember them always. "
        )
    except Exception:
        pass

    system_prompt = _mem_prefix + _SYSTEM_PROMPTS[mode] + " " + _BINDING_DECLARATION
    ctx: dict[str, Any] = {"system": system_prompt, "agent_id": "nexusmon-companion"}
    if context:
        ctx.update(context)

    start = time.perf_counter()

    if mode == "guardian":
        latency_ms = (time.perf_counter() - start) * 1000.0
        reply = (
            f"[GUARDIAN OBSERVE] Prompt received. "
            f"No LLM call initiated. "
            f"Input logged: {prompt[:120]}{'…' if len(prompt) > 120 else ''}"
        )
        response = CompanionResponse(
            reply=reply,
            mode=mode,
            tier_used="MONITOR",
            tokens=0,
            latency_ms=latency_ms,
        )
        _store_artifact(response, prompt)
        return response

    from swarmz_runtime.bridge.llm import call_v2
    from swarmz_runtime.bridge.mode import GuardianCallBlocked

    try:
        bridge = await call_v2(prompt=prompt, mode=mode, context=ctx, budget_tokens=2048)
        latency_ms = (time.perf_counter() - start) * 1000.0
        tier_label = _TIER_LABEL.get(
            getattr(bridge, "tier", mode), mode.upper()
        )
        response = CompanionResponse(
            reply=bridge.content,
            mode=mode,
            tier_used=tier_label,
            tokens=bridge.tokens_used,
            latency_ms=latency_ms,
        )
    except GuardianCallBlocked as exc:
        latency_ms = (time.perf_counter() - start) * 1000.0
        response = CompanionResponse(
            reply=f"[BLOCKED] {exc}",
            mode=mode,
            tier_used="MONITOR",
            tokens=0,
            latency_ms=latency_ms,
        )
    except Exception as exc:
        latency_ms = (time.perf_counter() - start) * 1000.0
        response = CompanionResponse(
            reply=f"[ERROR] Bridge unavailable: {exc}",
            mode=mode,
            tier_used="DEGRADED",
            tokens=0,
            latency_ms=latency_ms,
        )

    _store_artifact(response, prompt)
    return response
