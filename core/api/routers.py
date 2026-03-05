from __future__ import annotations

import json
from typing import Any, AsyncGenerator

from fastapi import APIRouter, HTTPException, Request

from core.artifact_vault.vault import artifact_vault
from core.evolution.engine import evolution_engine
from core.governance.policy_gate import MAX_TIME_BUDGET, MAX_TOKEN_BUDGET, policy_gate
from core.models.mission import Mission, MissionBudget, MissionCreate, MissionType
from core.orchestrator.engine import orchestrator
from core.shadow.channel import shadow_channel

missions_router = APIRouter()
audit_router = APIRouter()
avatar_router = APIRouter()
health_ext_router = APIRouter()


def _coerce_mission_type(raw: str) -> MissionType:
    normalized = (raw or "").strip().lower()
    mapping = {
        "analysis": MissionType.ANALYSIS,
        "data_transform": MissionType.TRANSFORM,
        "transform": MissionType.TRANSFORM,
        "artifact_gen": MissionType.ARTIFACT_GEN,
        "webhook_triggered": MissionType.WEBHOOK,
        "webhook": MissionType.WEBHOOK,
        "scheduled": MissionType.SCHEDULED,
        "ui_mutation": MissionType.UI_MUTATION,
        "worker_forge": MissionType.WORKER_FORGE,
        "self_diagnose": MissionType.SELF_DIAGNOSE,
    }
    return mapping.get(normalized, MissionType.ANALYSIS)


def _coerce_mission_budget(payload: dict[str, Any]) -> MissionBudget:
    budget_raw = payload.get("budget")
    if isinstance(budget_raw, dict):
        try:
            return MissionBudget(**budget_raw)
        except Exception:
            return MissionBudget()
    return MissionBudget()


def build_mission_from_compat_payload(payload: MissionCreate) -> Mission:
    mission_payload = payload.payload if isinstance(payload.payload, dict) else {}
    return Mission(
        type=_coerce_mission_type(payload.type.value),
        payload=mission_payload,
        operator_id=payload.operator_id,
        budget=payload.budget or _coerce_mission_budget(mission_payload),
    )


async def dispatch_mission_orchestrator(
    mission_type: str,
    payload: dict[str, Any],
    operator_id: str | None = None,
) -> dict[str, Any]:
    create = MissionCreate(
        type=_coerce_mission_type(mission_type),
        payload=payload,
        operator_id=operator_id,
        budget=_coerce_mission_budget(payload),
    )
    mission = build_mission_from_compat_payload(create)
    result = await orchestrator.dispatch(mission)
    return result.model_dump()


async def get_mission_orchestrator(mission_id: str) -> dict[str, Any] | None:
    mission = await orchestrator.get(mission_id)
    return mission.model_dump() if mission else None


async def list_missions_orchestrator(limit: int = 50) -> list[dict[str, Any]]:
    missions = await orchestrator.list_recent(limit=limit)
    return [item.model_dump() for item in missions]


async def get_governance_log(mission_id: str) -> list[dict[str, Any]]:
    entries = await shadow_channel.get_by_mission(mission_id)
    return [item for item in entries if item.get("event_type") == "governance"]


async def get_artifacts_for_mission(mission_id: str) -> list[dict[str, Any]]:
    artifacts = await artifact_vault.list_by_mission(mission_id)
    return [item.model_dump() for item in artifacts]


async def get_audit_entries(
    mission_id: str | None = None, limit: int = 100
) -> dict[str, Any]:
    if mission_id:
        entries = await shadow_channel.get_by_mission(mission_id)
    else:
        entries = await shadow_channel.get_recent(limit=limit)
    return {"entries": entries, "count": len(entries)}


async def stream_audit_entries(request: Request) -> AsyncGenerator[str, None]:
    async for entry in shadow_channel.tail():
        if await request.is_disconnected():
            break
        yield f"data: {json.dumps(entry)}\n\n"


async def get_avatar_state() -> dict[str, Any]:
    avatar = await evolution_engine.get_avatar()
    return avatar.model_dump()


async def get_avatar_xp_compat() -> dict[str, Any]:
    summary = await evolution_engine.get_xp_summary()
    return {
        "xp": summary.get("xp", 0),
        "rank": summary.get("rank", "DORMANT"),
        "last_delta_source": None,
        "summary": summary,
    }


async def get_health_governance_payload() -> dict[str, Any]:
    return {
        "status": "ok",
        "policy_gate": "armed",
        "max_token_budget": MAX_TOKEN_BUDGET,
        "max_time_budget": MAX_TIME_BUDGET,
    }


async def get_health_orchestrator_payload() -> dict[str, Any]:
    recent = await orchestrator.list_recent(limit=1)
    return {
        "status": "ok",
        "engine": "ready",
        "recent_missions": len(recent),
    }


async def get_health_avatar_payload() -> dict[str, Any]:
    summary = await evolution_engine.get_xp_summary()
    return {"status": "ok", **summary}


@missions_router.post("/{mission_id}/cancel")
async def api_cancel_mission(mission_id: str):
    return await orchestrator.cancel(mission_id)


@avatar_router.get("")
async def api_get_avatar():
    return await get_avatar_state()


@audit_router.get("/_health")
async def api_audit_router_health():
    return {"ok": True}


@health_ext_router.get("/_health")
async def api_health_router_health():
    return {"ok": True}
