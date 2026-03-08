# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
"""Truthful telemetry summary helpers for the active cockpit."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from core.api.mission_read_model import build_mission_list_payload


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def _safe_health_snapshot() -> dict[str, Any]:
    try:
        from swarmz_runtime.api.server import _health_subsystem_snapshot

        subsystems = _health_subsystem_snapshot()
    except Exception as exc:
        return {
            "available": False,
            "status": "degraded",
            "subsystems": {},
            "healthy_count": 0,
            "degraded_count": 0,
            "error": str(exc),
        }

    degraded = [name for name, status in subsystems.items() if status != "ok"]
    return {
        "available": True,
        "status": "ok" if not degraded else "degraded",
        "subsystems": subsystems,
        "healthy_count": len(subsystems) - len(degraded),
        "degraded_count": len(degraded),
    }


def _safe_bridge_snapshot() -> dict[str, Any]:
    try:
        from swarmz_runtime.bridge.config import get_fallback_chain

        chain = get_fallback_chain("cortex")
        providers = [f"{entry.get('provider')}/{entry.get('model')}" for entry in chain]
    except Exception as exc:
        return {
            "available": False,
            "status": "degraded",
            "providers": [],
            "provider_count": 0,
            "primary_provider": None,
            "mode_table": {
                "strategic": "cortex",
                "combat": "reflex",
                "guardian": "blocked",
            },
            "error": str(exc),
        }

    try:
        from swarmz_runtime.bridge import get_bridge_status

        bridge_status = get_bridge_status()
    except Exception:
        bridge_status = {}

    return {
        "available": True,
        "status": "ok" if providers else "degraded",
        "providers": providers,
        "provider_count": len(providers),
        "primary_provider": providers[0] if providers else None,
        "circuit_breaker": bridge_status.get("circuit", {}),
        "budget": bridge_status.get("cost", {}),
        "mode_table": {
            "strategic": "cortex",
            "combat": "reflex",
            "guardian": "blocked",
        },
    }


def _safe_mission_snapshot() -> dict[str, Any]:
    try:
        from swarmz_runtime.api.missions import get_engine

        missions = get_engine().list_missions(status=None)
        payload = build_mission_list_payload(missions, source="runtime_engine")
    except Exception as exc:
        return {
            "available": False,
            "total": 0,
            "execution_backed": 0,
            "queued": 0,
            "running": 0,
            "read_only": 0,
            "error": str(exc),
        }

    items = payload.get("items", []) if isinstance(payload, dict) else []
    execution_backed = sum(1 for item in items if item.get("execution_backed") is True)
    queued = sum(1 for item in items if item.get("status") in {"queued", "validating"})
    running = sum(1 for item in items if item.get("status") == "running")
    return {
        "available": True,
        "total": len(items),
        "execution_backed": execution_backed,
        "queued": queued,
        "running": running,
        "read_only": max(len(items) - execution_backed, 0),
    }


def _safe_evolution_snapshot(agent_id: str) -> dict[str, Any]:
    try:
        from swarmz_runtime.evolution.engine import get_state

        state = get_state(agent_id).to_dict()
    except Exception as exc:
        return {
            "available": False,
            "stage": None,
            "xp": None,
            "next_threshold": None,
            "resonance": None,
            "visual_state": None,
            "error": str(exc),
        }

    return {
        "available": True,
        "stage": state.get("stage"),
        "xp": state.get("xp"),
        "next_threshold": state.get("next_threshold"),
        "resonance": state.get("resonance"),
        "visual_state": state.get("visual_state"),
    }


def _safe_bond_snapshot(operator_id: str, operator_name: str) -> dict[str, Any]:
    try:
        from core.bond.memory import fetch_bond_context

        context = fetch_bond_context(operator_id=operator_id, operator_name=operator_name)
    except Exception as exc:
        return {
            "available": False,
            "mood": None,
            "form": None,
            "resonance": None,
            "last_seen_at": None,
            "unfinished_count": 0,
            "memory_count": 0,
            "conversation_count": 0,
            "error": str(exc),
        }

    state = context.get("state")
    unfinished = context.get("unfinished_missions") or []
    memories = context.get("memory_excerpt") or []
    conversation = context.get("conversation_excerpt") or []
    return {
        "available": True,
        "mood": getattr(state, "mood", None),
        "form": getattr(state, "form", None),
        "resonance": getattr(state, "resonance", None),
        "last_seen_at": context.get("last_seen_at") or getattr(state, "last_seen_at", None),
        "unfinished_count": len(unfinished),
        "memory_count": len(memories),
        "conversation_count": len(conversation),
    }


def get_telemetry_summary(
    *,
    agent_id: str = "nexusmon",
    operator_id: str = "regan-harris",
    operator_name: str = "Regan Harris",
) -> dict[str, Any]:
    health = _safe_health_snapshot()
    bridge = _safe_bridge_snapshot()
    missions = _safe_mission_snapshot()
    evolution = _safe_evolution_snapshot(agent_id)
    bond = _safe_bond_snapshot(operator_id, operator_name)

    degraded_feeds = [
        name
        for name, payload in {
            "health": health,
            "bridge": bridge,
            "missions": missions,
            "evolution": evolution,
            "bond": bond,
        }.items()
        if payload.get("available") is False or payload.get("status") == "degraded"
    ]

    return {
        "ok": True,
        "timestamp": _utc_now_iso(),
        "status": "ok" if not degraded_feeds else "degraded",
        "degraded_feeds": degraded_feeds,
        "health": health,
        "bridge": bridge,
        "missions": missions,
        "evolution": evolution,
        "bond": bond,
    }