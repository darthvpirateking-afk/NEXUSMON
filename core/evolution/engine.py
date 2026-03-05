from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path

from core.evolution.xp_table import (
    RANK_UNLOCKS,
    XP_TABLE,
    get_rank,
    rank_progress_pct,
    xp_to_next_rank,
)
from core.governance.capability_flags import capability_flags
from core.models.avatar import Avatar, Rank
from core.models.mission import Mission, MissionStatus
from core.shadow.channel import shadow_channel

AVATAR_PATH = Path("artifacts/state/avatar.json")


class EvolutionEngine:
    def __init__(self) -> None:
        AVATAR_PATH.parent.mkdir(parents=True, exist_ok=True)

    def _load(self) -> Avatar:
        if AVATAR_PATH.exists():
            return Avatar(**json.loads(AVATAR_PATH.read_text(encoding="utf-8")))
        return Avatar()

    def _save(self, avatar: Avatar) -> None:
        AVATAR_PATH.write_text(avatar.model_dump_json(indent=2), encoding="utf-8")

    async def tick(self, mission: Mission) -> Avatar:
        loop = asyncio.get_event_loop()
        avatar = await loop.run_in_executor(None, self._load)
        old_rank = get_rank(avatar.xp)

        if mission.status == MissionStatus.COMPLETE:
            xp_delta = (
                XP_TABLE["mission_complete_fast"]
                if mission.completed_fast
                else XP_TABLE["mission_complete"]
            )
            if mission.artifact_ids:
                xp_delta += XP_TABLE["artifact_generated"]
        elif mission.status == MissionStatus.FAILED:
            xp_delta = XP_TABLE["mission_timeout"]
        else:
            xp_delta = 0

        mission.xp_awarded = xp_delta
        avatar.xp = max(0, avatar.xp + xp_delta)
        avatar.rank = get_rank(avatar.xp)
        avatar.last_active = datetime.utcnow()

        if mission.status == MissionStatus.COMPLETE:
            avatar.missions_complete += 1
            avatar.artifacts_generated += len(mission.artifact_ids)
        elif mission.status == MissionStatus.FAILED:
            avatar.missions_failed += 1

        await loop.run_in_executor(None, self._save, avatar)

        await shadow_channel.log(
            "xp_awarded",
            mission.id,
            {
                "xp_delta": xp_delta,
                "new_total": avatar.xp,
                "old_rank": old_rank.value,
                "new_rank": avatar.rank.value,
            },
        )

        if avatar.rank != old_rank:
            await self._handle_rank_up(avatar, avatar.rank)

        return avatar

    async def _handle_rank_up(self, avatar: Avatar, new_rank: Rank) -> None:
        if new_rank == Rank.SOVEREIGN:
            avatar.evolution_pending = True
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._save, avatar)
            await shadow_channel.log(
                "rank_up_pending",
                avatar.id,
                {
                    "new_rank": new_rank.value,
                    "message": "Operator approval required for SOVEREIGN",
                },
            )
            return

        if new_rank == Rank.ASCENDANT:
            await shadow_channel.log(
                "rank_up_pending",
                avatar.id,
                {
                    "new_rank": new_rank.value,
                    "message": "Operator approval required for ASCENDANT actions",
                },
            )
            return

        unlocks = RANK_UNLOCKS.get(new_rank, [])
        for capability in unlocks:
            capability_flags.enable(capability)

        await shadow_channel.log(
            "rank_up",
            avatar.id,
            {"new_rank": new_rank.value, "capabilities_unlocked": unlocks},
        )

    async def get_avatar(self) -> Avatar:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load)

    async def get_xp_summary(self) -> dict:
        avatar = await self.get_avatar()
        return {
            "xp": avatar.xp,
            "rank": avatar.rank.value,
            "xp_to_next_rank": xp_to_next_rank(avatar.xp),
            "progress_pct": rank_progress_pct(avatar.xp),
            "missions_complete": avatar.missions_complete,
            "missions_failed": avatar.missions_failed,
            "capabilities": avatar.capabilities.model_dump(),
            "evolution_pending": avatar.evolution_pending,
        }


evolution_engine = EvolutionEngine()
