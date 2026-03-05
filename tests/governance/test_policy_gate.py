from __future__ import annotations

import pytest

from core.governance.capability_flags import capability_flags
from core.governance.policy_gate import PolicyGate
from core.governance.policy_result import PolicyResult
from core.models.mission import Mission, MissionBudget, MissionType


@pytest.fixture(autouse=True)
def reset_flags():
    capability_flags.reset()
    yield
    capability_flags.reset()


@pytest.fixture
def gate():
    return PolicyGate()


@pytest.mark.asyncio
async def test_analysis_passes_by_default(gate):
    mission = Mission(type=MissionType.ANALYSIS, payload={"prompt": "test"})
    result = await gate.evaluate(mission)
    assert result == PolicyResult.PASS


@pytest.mark.asyncio
async def test_artifact_gen_denied_without_flag(gate):
    mission = Mission(type=MissionType.ARTIFACT_GEN, payload={"prompt": "test"})
    result = await gate.evaluate(mission)
    assert result == PolicyResult.DENY


@pytest.mark.asyncio
async def test_artifact_gen_passes_with_flag(gate):
    capability_flags.enable("can_write_artifacts")
    mission = Mission(type=MissionType.ARTIFACT_GEN, payload={"prompt": "test"})
    result = await gate.evaluate(mission)
    assert result == PolicyResult.PASS


@pytest.mark.asyncio
async def test_oversized_budget_escalates(gate):
    mission = Mission(
        type=MissionType.ANALYSIS,
        payload={"prompt": "test"},
        budget=MissionBudget(tokens=999_999),
    )
    result = await gate.evaluate(mission)
    assert result == PolicyResult.ESCALATE


def test_policy_result_worst():
    assert PolicyResult.PASS.worst(PolicyResult.DENY) == PolicyResult.DENY
    assert (
        PolicyResult.ESCALATE.worst(PolicyResult.QUARANTINE)
        == PolicyResult.QUARANTINE
    )
    assert PolicyResult.DENY.worst(PolicyResult.PASS) == PolicyResult.DENY
