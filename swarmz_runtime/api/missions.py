# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from swarmz_runtime.bridge.mode import NexusmonMode
from swarmz_runtime.core.engine import SwarmzEngine

router = APIRouter()


def get_engine() -> SwarmzEngine:
    return SwarmzEngine()


class CreateMissionRequest(BaseModel):
    goal: str
    category: str
    constraints: dict[str, Any] = {}
    mode: NexusmonMode | None = None  # strategic | combat | guardian


class RunMissionRequest(BaseModel):
    mission_id: str
    operator_key: str | None = None


class ApproveMissionRequest(BaseModel):
    mission_id: str
    operator_key: str


@router.post("/create")
def create_mission(request: CreateMissionRequest):
    result = get_engine().create_mission(
        goal=request.goal,
        category=request.category,
        constraints=request.constraints,
        mode=request.mode.value if request.mode else None,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/run")
def run_mission(request: RunMissionRequest):
    result = get_engine().run_mission(
        mission_id=request.mission_id, operator_key=request.operator_key
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/list")
def list_missions(status: str | None = None):
    missions = get_engine().list_missions(status=status)
    return {"missions": missions, "count": len(missions)}


@router.get("")
def list_missions_root(status: str | None = None):
    return list_missions(status=status)


@router.post("/approve")
def approve_mission(request: ApproveMissionRequest):
    result = get_engine().approve_mission(
        mission_id=request.mission_id, operator_key=request.operator_key
    )
    if "error" in result:
        raise HTTPException(status_code=403, detail=result["error"])
    return result
