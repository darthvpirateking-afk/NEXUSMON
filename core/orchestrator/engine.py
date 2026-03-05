from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from core.artifact_vault.vault import artifact_vault
from core.evolution.engine import evolution_engine
from core.governance.policy_gate import policy_gate
from core.governance.policy_result import PolicyResult
from core.models.mission import Mission, MissionResult, MissionStatus
from core.orchestrator.rollback import rollback_engine
from core.orchestrator.worker_router import route_to_worker
from core.shadow.channel import shadow_channel

_mission_store: dict[str, Mission] = {}


class OrchestratorEngine:
    async def dispatch(self, mission: Mission) -> MissionResult:
        _mission_store[mission.id] = mission

        await self._set_status(mission, MissionStatus.GOVERNANCE)
        policy_result = await policy_gate.evaluate(mission)
        mission.governance_result = policy_result.value
        _mission_store[mission.id] = mission

        await shadow_channel.log(
            "governance",
            mission.id,
            {"result": policy_result.value, "mission_type": mission.type.value},
            operator_id=mission.operator_id,
        )

        if policy_result == PolicyResult.DENY:
            await self._set_status(mission, MissionStatus.DENIED)
            return MissionResult.denied(mission)

        if policy_result == PolicyResult.QUARANTINE:
            await self._set_status(mission, MissionStatus.QUARANTINED)
            await shadow_channel.log(
                "quarantine",
                mission.id,
                {"reason": "PolicyGate returned QUARANTINE"},
                operator_id=mission.operator_id,
            )
            return MissionResult.quarantined(mission)

        await self._set_status(mission, MissionStatus.RUNNING)
        checkpoint = await rollback_engine.create_checkpoint(
            mission.id, {"status": "pre_execution", "mission": mission.model_dump()}
        )
        start_time = datetime.utcnow()

        try:
            worker = route_to_worker(mission)
            await shadow_channel.log(
                "worker_assigned",
                mission.id,
                {"worker": worker.name},
                operator_id=mission.operator_id,
            )

            result: dict[str, Any] = await asyncio.wait_for(
                worker.execute(mission),
                timeout=float(mission.budget.time_seconds),
            )

            elapsed_seconds = (datetime.utcnow() - start_time).total_seconds()
            mission.completed_fast = elapsed_seconds < (
                mission.budget.time_seconds * 0.5
            )
            mission.tokens_used = int(result.get("tokens_used", 0))

            artifact = await artifact_vault.seal(mission.id, result)
            mission.artifact_ids.append(artifact.id)

            await shadow_channel.log(
                "artifact_sealed",
                mission.id,
                {
                    "artifact_id": artifact.id,
                    "checksum": artifact.checksum,
                    "size_bytes": artifact.size_bytes,
                },
                operator_id=mission.operator_id,
            )

            mission.completed_at = datetime.utcnow()
            await self._set_status(mission, MissionStatus.COMPLETE)
            await evolution_engine.tick(mission)
            return MissionResult.success_result(mission, artifact.id)

        except asyncio.TimeoutError:
            await self._handle_failure(mission, checkpoint, "timeout")
            return MissionResult.failed(mission, "timeout")
        except Exception as exc:
            await self._handle_failure(mission, checkpoint, str(exc))
            return MissionResult.failed(mission, str(exc))

    async def _handle_failure(
        self, mission: Mission, checkpoint: Any, error: str
    ) -> None:
        await self._set_status(mission, MissionStatus.ROLLBACK)
        await rollback_engine.rollback_to(checkpoint)
        mission.error = error
        await self._set_status(mission, MissionStatus.FAILED)
        await shadow_channel.log(
            "failure", mission.id, {"error": error}, operator_id=mission.operator_id
        )
        await evolution_engine.tick(mission)

    async def get(self, mission_id: str) -> Mission | None:
        return _mission_store.get(mission_id)

    async def list_recent(self, limit: int = 50) -> list[Mission]:
        missions = list(_mission_store.values())
        return sorted(missions, key=lambda mission: mission.created_at, reverse=True)[
            :limit
        ]

    async def cancel(self, mission_id: str) -> dict[str, Any]:
        mission = _mission_store.get(mission_id)
        if not mission:
            return {"error": "not found"}
        if mission.status == MissionStatus.RUNNING:
            mission.error = "Cancelled by operator"
            await self._set_status(mission, MissionStatus.FAILED)
        return {"cancelled": True, "mission_id": mission_id}

    async def _set_status(self, mission: Mission, status: MissionStatus) -> None:
        mission.status = status
        _mission_store[mission.id] = mission
        await shadow_channel.log(
            "status_change",
            mission.id,
            {"status": status.value},
            operator_id=mission.operator_id,
        )


orchestrator = OrchestratorEngine()
