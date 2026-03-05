from __future__ import annotations

from typing import Any

from core.models.mission import Mission, MissionType
from swarmz_runtime.bridge import call_v2


class BaseWorker:
    name: str = "BASE"

    async def execute(self, mission: Mission) -> dict[str, Any]:
        raise NotImplementedError


class BytewolfWorker(BaseWorker):
    name = "BYTEWOLF"

    async def execute(self, mission: Mission) -> dict[str, Any]:
        prompt = mission.payload.get("prompt", "analyze")
        response = await call_v2(
            prompt=f"[BYTEWOLF PATHFINDER]\n{prompt}",
            tier=1,
            budget_tokens=mission.budget.tokens,
            context={"mission_id": mission.id, "worker": self.name},
        )
        return {
            "worker": self.name,
            "response": response.content,
            "tokens_used": response.tokens_used,
            "model": response.model_used,
            "latency_ms": response.latency_ms,
        }


class GlitchraWorker(BaseWorker):
    name = "GLITCHRA"

    async def execute(self, mission: Mission) -> dict[str, Any]:
        prompt = mission.payload.get("prompt", "detect anomalies")
        response = await call_v2(
            prompt=f"[GLITCHRA SENTINEL]\n{prompt}",
            tier=1,
            budget_tokens=mission.budget.tokens,
            context={"mission_id": mission.id, "worker": self.name},
        )
        return {
            "worker": self.name,
            "response": response.content,
            "tokens_used": response.tokens_used,
            "model": response.model_used,
            "latency_ms": response.latency_ms,
        }


class SigildronWorker(BaseWorker):
    name = "SIGILDRON"

    async def execute(self, mission: Mission) -> dict[str, Any]:
        prompt = mission.payload.get("prompt", "generate artifact")
        response = await call_v2(
            prompt=f"[SIGILDRON COURIER]\n{prompt}",
            tier=1,
            budget_tokens=mission.budget.tokens,
            context={"mission_id": mission.id, "worker": self.name},
        )
        return {
            "worker": self.name,
            "response": response.content,
            "tokens_used": response.tokens_used,
            "model": response.model_used,
            "latency_ms": response.latency_ms,
        }


WORKER_MAP: dict[MissionType, type[BaseWorker]] = {
    MissionType.ANALYSIS: BytewolfWorker,
    MissionType.TRANSFORM: GlitchraWorker,
    MissionType.ARTIFACT_GEN: SigildronWorker,
    MissionType.WEBHOOK: BytewolfWorker,
    MissionType.SCHEDULED: BytewolfWorker,
}


def route_to_worker(mission: Mission) -> BaseWorker:
    worker_class = WORKER_MAP.get(mission.type, BytewolfWorker)
    return worker_class()
