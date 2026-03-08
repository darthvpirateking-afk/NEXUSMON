from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/bond/status")
async def get_bond_status(
    agent_id: str = "nexusmon",
    operator_id: str = "regan-harris",
    operator_name: str = "Regan Harris",
):
    from core.bond.voice import build_bond_status

    response = await build_bond_status(
        agent_id=agent_id,
        operator_id=operator_id,
        operator_name=operator_name,
    )
    payload = response.model_dump(mode="json")
    if response.error:
        return JSONResponse(status_code=503, content=payload)
    return payload