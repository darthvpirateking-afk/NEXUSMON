from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from core.governance.capability_flags import capability_flags
from core.models.mission import Mission, MissionStatus, MissionType
from core.orchestrator.engine import OrchestratorEngine
import core.orchestrator.engine as engine_module


@pytest.fixture(autouse=True)
def reset_orchestrator_state():
    engine_module._mission_store.clear()
    capability_flags.reset()
    yield
    engine_module._mission_store.clear()
    capability_flags.reset()


@pytest.fixture
def engine():
    return OrchestratorEngine()


@pytest.mark.asyncio
async def test_analysis_mission_reaches_terminal_state(engine):
    mission = Mission(type=MissionType.ANALYSIS, payload={"prompt": "test"})
    with patch(
        "core.orchestrator.worker_router.call_v2",
        new_callable=AsyncMock,
    ) as mock_bridge:
        mock_bridge.return_value = SimpleNamespace(
            content="ok",
            model_used="mock-model",
            tokens_used=10,
            latency_ms=5.0,
            tier=1,
        )
        result = await engine.dispatch(mission)
    assert result.mission.status in {
        MissionStatus.COMPLETE,
        MissionStatus.DENIED,
        MissionStatus.FAILED,
        MissionStatus.QUARANTINED,
    }


@pytest.mark.asyncio
async def test_governance_result_is_set(engine):
    mission = Mission(
        type=MissionType.ANALYSIS,
        payload={"prompt": "governance check"},
    )
    with patch(
        "core.orchestrator.worker_router.call_v2",
        new_callable=AsyncMock,
    ) as mock_bridge:
        mock_bridge.return_value = SimpleNamespace(
            content="ok",
            model_used="mock-model",
            tokens_used=10,
            latency_ms=5.0,
            tier=1,
        )
        result = await engine.dispatch(mission)
    assert result.mission.governance_result is not None


@pytest.mark.asyncio
async def test_artifact_gen_denied_without_capability(engine):
    mission = Mission(type=MissionType.ARTIFACT_GEN, payload={"prompt": "generate"})
    result = await engine.dispatch(mission)
    assert result.mission.status == MissionStatus.DENIED


@pytest.mark.asyncio
async def test_mission_retrievable_after_dispatch(engine):
    mission = Mission(type=MissionType.ANALYSIS, payload={"prompt": "storage"})
    with patch(
        "core.orchestrator.worker_router.call_v2",
        new_callable=AsyncMock,
    ) as mock_bridge:
        mock_bridge.return_value = SimpleNamespace(
            content="ok",
            model_used="mock-model",
            tokens_used=10,
            latency_ms=5.0,
            tier=1,
        )
        result = await engine.dispatch(mission)
    stored = await engine.get(result.mission.id)
    assert stored is not None
    assert stored.id == result.mission.id


@pytest.mark.asyncio
async def test_cancel_running_mission(engine):
    mission = Mission(type=MissionType.ANALYSIS, payload={"prompt": "cancel test"})
    with patch(
        "core.orchestrator.worker_router.call_v2",
        new_callable=AsyncMock,
    ) as mock_bridge:
        mock_bridge.return_value = SimpleNamespace(
            content="ok",
            model_used="mock-model",
            tokens_used=10,
            latency_ms=5.0,
            tier=1,
        )
        result = await engine.dispatch(mission)
    cancel = await engine.cancel(result.mission.id)
    assert cancel.get("cancelled") is True
