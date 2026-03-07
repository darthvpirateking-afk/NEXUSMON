from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_status(raw_status: str) -> str:
    normalized = raw_status.strip().lower()
    aliases = {
        "pending": "queued",
        "queued": "queued",
        "idle": "queued",
        "governance_check": "validating",
        "initializing": "validating",
        "running": "running",
        "paused": "paused",
        "complete": "succeeded",
        "completed": "succeeded",
        "success": "succeeded",
        "succeeded": "succeeded",
        "failed": "failed",
        "aborted": "rolled_back",
        "rolling_back": "rolled_back",
        "rolled_back": "rolled_back",
        "denied": "blocked",
        "quarantined": "blocked",
    }
    return aliases.get(normalized, normalized or "unknown")


def _has_execution_output(raw_mission: dict[str, Any]) -> bool:
    bridge_output = raw_mission.get("bridge_output")
    if isinstance(bridge_output, str):
        return bool(bridge_output.strip())
    return bridge_output is not None


def _execution_truth_fields(raw_mission: dict[str, Any]) -> dict[str, Any]:
    execution_backed = _has_execution_output(raw_mission)
    if execution_backed:
        return {
            "execution_backed": True,
            "execution_truth_label": "EXECUTION-BACKED",
            "execution_truth_detail": "Execution output is present in the mission payload.",
        }
    return {
        "execution_backed": False,
        "execution_truth_label": "LIFECYCLE STATE ONLY",
        "execution_truth_detail": "Execution not yet wired.",
    }


def _read_model_execution_truth_fields(raw_mission: dict[str, Any]) -> dict[str, Any]:
    execution_backed = _has_execution_output(raw_mission)
    if execution_backed:
        return {
            "execution_backed": True,
            "execution_truth_label": "EXECUTION-BACKED",
            "execution_truth_detail": "Execution output is present in the mission payload.",
        }

    normalized_status = _normalize_status(
        _as_text(raw_mission.get("status") or raw_mission.get("state") or "UNKNOWN")
    )
    if normalized_status in {"queued", "validating"}:
        return {
            "execution_backed": False,
            "execution_truth_label": "QUEUED RECORD",
            "execution_truth_detail": "Queued in backend contract.",
        }

    return {
        "execution_backed": False,
        "execution_truth_label": "READ-MODEL ONLY",
        "execution_truth_detail": "Display-only backend record.",
    }


def canonicalize_mission_record(
    raw_mission: dict[str, Any],
    *,
    source: str,
) -> dict[str, Any]:
    mission_id = _as_text(raw_mission.get("mission_id") or raw_mission.get("id"))
    raw_status = _as_text(raw_mission.get("status") or raw_mission.get("state") or "UNKNOWN")
    created_at = _as_text(
        raw_mission.get("created_at")
        or raw_mission.get("timestamp")
        or raw_mission.get("started_at")
    )
    updated_at = _as_text(
        raw_mission.get("updated_at")
        or raw_mission.get("ended_at")
        or raw_mission.get("started_at")
        or created_at
    )
    title = _as_text(
        raw_mission.get("title")
        or raw_mission.get("goal")
        or raw_mission.get("prompt")
        or raw_mission.get("name")
        or mission_id
    )
    return {
        "id": mission_id,
        "mission_id": mission_id,
        "title": title or "untitled mission",
        "status": _normalize_status(raw_status),
        "status_raw": raw_status or "UNKNOWN",
        "category": _as_text(raw_mission.get("category") or raw_mission.get("type") or "unknown"),
        "created_at": created_at or _utc_now_iso(),
        "updated_at": updated_at or created_at or _utc_now_iso(),
        "created_by": _as_text(raw_mission.get("created_by") or "operator"),
        "risk_level": _as_text(raw_mission.get("risk_level") or "unknown"),
        "latest_run_id": _as_text(raw_mission.get("latest_run_id") or raw_mission.get("run_id")),
        "source": source,
        "truth": "backend",
        **_read_model_execution_truth_fields(raw_mission),
    }


def build_mission_list_payload(
    missions: Iterable[dict[str, Any]],
    *,
    source: str,
    ok: bool = True,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    mission_rows = [
        {
            **dict(mission),
            **_execution_truth_fields(dict(mission)),
        }
        for mission in missions
        if isinstance(mission, dict)
    ]
    payload = {
        "ok": ok,
        "missions": mission_rows,
        "count": len(mission_rows),
        "items": [
            canonicalize_mission_record(mission, source=source) for mission in mission_rows
        ],
        "read_model_version": "v1",
        "source": source,
    }
    if extra:
        payload.update(extra)
    return payload


def build_mission_detail_payload(
    mission: dict[str, Any],
    *,
    source: str,
    governance: str,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload = {
        "mission_id": _as_text(mission.get("mission_id") or mission.get("id")),
        "status": _as_text(mission.get("status") or mission.get("state") or "UNKNOWN"),
        "governance": governance,
        "mission": {
            **mission,
            **_execution_truth_fields(mission),
        },
        "read_model": canonicalize_mission_record(mission, source=source),
    }
    if extra:
        payload.update(extra)
    return payload