from __future__ import annotations

from fastapi import APIRouter

from core.supply.registry import build_supply_network

router = APIRouter()


@router.get("/supply/network")
def get_supply_network():
    return build_supply_network().model_dump(mode="json")