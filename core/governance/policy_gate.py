from __future__ import annotations

import asyncio

from core.governance.capability_flags import capability_flags
from core.governance.policy_result import PolicyResult
from core.models.mission import Mission, MissionType

MAX_TOKEN_BUDGET = 50_000
MAX_TIME_BUDGET = 3_600

MISSION_REQUIRED_CAPABILITIES: dict[MissionType, list[str]] = {
    MissionType.ARTIFACT_GEN: ["can_write_artifacts"],
    MissionType.ANALYSIS: [],
    MissionType.TRANSFORM: [],
    MissionType.WEBHOOK: [],
    MissionType.SCHEDULED: [],
    MissionType.UI_MUTATION: ["can_write_artifacts"],
    MissionType.WORKER_FORGE: ["can_trigger_evolution"],
    MissionType.SELF_DIAGNOSE: [],
}

HORIZON_2_TYPES: list[MissionType] = []


class PolicyGate:
    async def evaluate(self, mission: Mission) -> PolicyResult:
        checks = await asyncio.gather(
            self._check_capabilities(mission),
            self._check_budget(mission),
            self._check_domain_access(mission),
        )
        result = PolicyResult.PASS
        for check in checks:
            result = result.worst(check)
        return result

    async def _check_capabilities(self, mission: Mission) -> PolicyResult:
        required = MISSION_REQUIRED_CAPABILITIES.get(mission.type, [])
        for cap in required:
            if not capability_flags.is_enabled(cap):
                return PolicyResult.DENY
        return PolicyResult.PASS

    async def _check_budget(self, mission: Mission) -> PolicyResult:
        if mission.budget.tokens > MAX_TOKEN_BUDGET:
            return PolicyResult.ESCALATE
        if mission.budget.time_seconds > MAX_TIME_BUDGET:
            return PolicyResult.ESCALATE
        return PolicyResult.PASS

    async def _check_domain_access(self, mission: Mission) -> PolicyResult:
        if mission.type in HORIZON_2_TYPES:
            if not capability_flags.is_enabled("can_access_horizon_2"):
                return PolicyResult.DENY
        return PolicyResult.PASS


policy_gate = PolicyGate()
