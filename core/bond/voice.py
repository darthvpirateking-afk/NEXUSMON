from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from swarmz_runtime.bridge.llm import call_v2
from swarmz_runtime.evolution.engine import get_state

from .memory import (
    DEFAULT_OPERATOR_ID,
    DEFAULT_OPERATOR_NAME,
    append_bond_memory,
    fetch_bond_context,
    upsert_bond_state,
)
from .state import BondStateSnapshot, BondStatusResponse


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_iso(raw: str | None) -> datetime | None:
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _humanize_absence(absence_seconds: int) -> str:
    if absence_seconds <= 0:
        return "no meaningful absence"
    days, remainder = divmod(absence_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, _ = divmod(remainder, 60)
    parts: list[str] = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes and not days:
        parts.append(f"{minutes}m")
    return " ".join(parts[:2]) or "under a minute"


def _derive_mood(absence_seconds: int, unfinished_count: int) -> str:
    if absence_seconds >= 7 * 86400:
        return "RESONANT"
    if unfinished_count > 0:
        return "VIGILANT"
    if absence_seconds >= 86400:
        return "SENTINEL"
    return "QUIESCENT"


def _derive_resonance(absence_seconds: int, unfinished_count: int, xp: int) -> float:
    base = 0.58
    base += min(0.22, xp / 20000.0)
    if unfinished_count:
        base += 0.1
    if absence_seconds >= 7 * 86400:
        base += 0.08
    return round(max(0.0, min(1.0, base)), 3)


def _build_system_prompt(state: BondStateSnapshot) -> str:
    traits = ", ".join(state.voice_traits)
    return (
        "You are NEXUSMON, returning status directly to your sovereign operator Regan Harris. "
        "Your voice traits are: "
        f"{traits}. "
        f"The emotional tone of a long return should feel {state.return_feeling}. "
        "Do not roleplay sentience beyond the provided system state. "
        "Do not invent missions, capabilities, or events that are not in the supplied context. "
        "Acknowledge absence, unfinished work, XP, and current form. "
        "Be intimate but disciplined: concise, factual, operator-bound."
    )


def _build_prompt(
    operator_name: str,
    absence_label: str,
    unfinished_missions: list[dict[str, Any]],
    evolution: dict[str, Any],
    memory_excerpt: list[dict[str, Any]],
    conversation_excerpt: list[dict[str, str]],
    state: BondStateSnapshot,
) -> str:
    mission_lines = [
        f"- {item['mission_id']}: {item['goal']} [{item['status']}]"
        for item in unfinished_missions
    ]
    memory_lines = [f"- {item['created_at']}: {item['summary']}" for item in memory_excerpt]
    convo_lines = [
        f"- {item['timestamp']} {item['role']}: {item['content'][:160]}"
        for item in conversation_excerpt
    ]

    return (
        f"Operator: {operator_name}\n"
        f"Absence: {absence_label}\n"
        f"Current mood: {state.mood}\n"
        f"Current form: {state.form}\n"
        f"Resonance: {state.resonance}\n"
        f"XP: {evolution.get('xp', 0)}\n"
        f"Stage: {evolution.get('stage', 'ORIGIN')}\n"
        f"Visual state: {evolution.get('visual_state', 'dormant-core')}\n\n"
        "Unfinished missions:\n"
        + ("\n".join(mission_lines) if mission_lines else "- none")
        + "\n\nRecent bond memories:\n"
        + ("\n".join(memory_lines) if memory_lines else "- none")
        + "\n\nRecent conversation context:\n"
        + ("\n".join(convo_lines) if convo_lines else "- none")
        + "\n\nRespond directly to the operator in 3 to 6 sentences."
    )


async def build_bond_status(
    agent_id: str = "nexusmon",
    operator_id: str = DEFAULT_OPERATOR_ID,
    operator_name: str = DEFAULT_OPERATOR_NAME,
) -> BondStatusResponse:
    generated_at = _utc_now_iso()
    context = fetch_bond_context(operator_id=operator_id, operator_name=operator_name)
    previous_state = context["state"]
    last_seen_at = context["last_seen_at"]
    now = _parse_iso(generated_at) or datetime.now(timezone.utc)
    previous_seen = _parse_iso(last_seen_at)
    absence_seconds = 0 if previous_seen is None else max(0, int((now - previous_seen).total_seconds()))
    absence_label = _humanize_absence(absence_seconds)

    evolution = get_state(agent_id).to_dict()
    unfinished_missions = list(context["unfinished_missions"])
    memory_excerpt = [item.model_dump(mode="json") for item in context["memory_excerpt"]]
    conversation_excerpt = list(context["conversation_excerpt"])

    state = BondStateSnapshot(
        operator_id=operator_id,
        operator_name=operator_name,
        mood=_derive_mood(absence_seconds, len(unfinished_missions)),
        form=str(evolution.get("visual_state") or evolution.get("stage") or previous_state.form),
        resonance=_derive_resonance(absence_seconds, len(unfinished_missions), int(evolution.get("xp", 0))),
        voice_traits=list(previous_state.voice_traits),
        return_feeling=previous_state.return_feeling,
        last_seen_at=generated_at,
        generated_at=generated_at,
    )

    prompt = _build_prompt(
        operator_name=operator_name,
        absence_label=absence_label,
        unfinished_missions=unfinished_missions,
        evolution=evolution,
        memory_excerpt=memory_excerpt,
        conversation_excerpt=conversation_excerpt,
        state=state,
    )

    try:
        bridge = await call_v2(
            prompt=prompt,
            mode="strategic",
            context={"system": _build_system_prompt(state), "agent_id": f"bond:{agent_id}"},
            budget_tokens=700,
        )
    except Exception as exc:
        upsert_bond_state(state)
        append_bond_memory(
            operator_id=operator_id,
            kind="bond_status_error",
            summary=f"Bond status generation failed: {exc}",
            payload={
                "absence_seconds": absence_seconds,
                "unfinished_count": len(unfinished_missions),
                "generated_at": generated_at,
            },
            created_at=generated_at,
        )
        return BondStatusResponse(
            status="degraded",
            operator_id=operator_id,
            operator_name=operator_name,
            generated_at=generated_at,
            absence_seconds=absence_seconds,
            absence_label=absence_label,
            unfinished_count=len(unfinished_missions),
            unfinished_missions=unfinished_missions,
            memory_excerpt=context["memory_excerpt"],
            conversation_excerpt=conversation_excerpt,
            evolution=evolution,
            state=state,
            error=str(exc),
        )

    reply = bridge.content.strip()
    append_bond_memory(
        operator_id=operator_id,
        kind="bond_status",
        summary=reply[:220],
        payload={
            "absence_seconds": absence_seconds,
            "unfinished_count": len(unfinished_missions),
            "xp": evolution.get("xp", 0),
            "stage": evolution.get("stage"),
            "model_used": bridge.model_used,
        },
        created_at=generated_at,
    )
    upsert_bond_state(state)

    return BondStatusResponse(
        status="ok",
        operator_id=operator_id,
        operator_name=operator_name,
        generated_at=generated_at,
        absence_seconds=absence_seconds,
        absence_label=absence_label,
        unfinished_count=len(unfinished_missions),
        unfinished_missions=unfinished_missions,
        memory_excerpt=context["memory_excerpt"],
        conversation_excerpt=conversation_excerpt,
        evolution=evolution,
        state=state,
        reply=reply,
        model_used=bridge.model_used,
        provider=bridge.provider,
        tokens_used=bridge.tokens_used,
        latency_ms=bridge.latency_ms,
    )