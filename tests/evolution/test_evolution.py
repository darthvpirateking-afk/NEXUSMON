from __future__ import annotations

from pathlib import Path

import pytest

import core.evolution.engine as evolution_module
import core.shadow.channel as shadow_module
from core.evolution.engine import EvolutionEngine
from core.evolution.xp_table import get_rank, rank_progress_pct, xp_to_next_rank
from core.governance.capability_flags import capability_flags
from core.models.avatar import Rank
from core.models.mission import Mission, MissionStatus, MissionType


@pytest.fixture(autouse=True)
def isolate_state(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(evolution_module, "AVATAR_PATH", tmp_path / "avatar.json")
    monkeypatch.setattr(shadow_module, "SHADOW_LOG", tmp_path / "shadow_audit.jsonl")
    capability_flags.reset()
    yield
    capability_flags.reset()


def test_rank_thresholds():
    assert get_rank(0) == Rank.DORMANT
    assert get_rank(499) == Rank.DORMANT
    assert get_rank(500) == Rank.AWAKENING
    assert get_rank(2_000) == Rank.ACTIVE
    assert get_rank(8_000) == Rank.SOVEREIGN
    assert get_rank(25_000) == Rank.ASCENDANT


def test_xp_to_next_rank():
    assert xp_to_next_rank(0) == 500
    assert xp_to_next_rank(500) == 1_500
    assert xp_to_next_rank(25_000) is None


def test_rank_progress_pct():
    pct = rank_progress_pct(250)
    assert 0.0 < pct < 1.0


@pytest.mark.asyncio
async def test_tick_awards_xp_on_complete():
    engine = EvolutionEngine()
    before = (await engine.get_avatar()).xp
    mission = Mission(
        type=MissionType.ANALYSIS,
        payload={"prompt": "xp test"},
        status=MissionStatus.COMPLETE,
    )
    await engine.tick(mission)
    after = (await engine.get_avatar()).xp
    assert after > before


@pytest.mark.asyncio
async def test_tick_penalizes_on_failure():
    engine = EvolutionEngine()
    mission_ok = Mission(
        type=MissionType.ANALYSIS,
        payload={"prompt": "setup"},
        status=MissionStatus.COMPLETE,
    )
    for _ in range(3):
        await engine.tick(mission_ok)
    mid = (await engine.get_avatar()).xp

    mission_fail = Mission(
        type=MissionType.ANALYSIS,
        payload={"prompt": "fail"},
        status=MissionStatus.FAILED,
    )
    await engine.tick(mission_fail)
    after = (await engine.get_avatar()).xp
    assert after < mid


@pytest.mark.asyncio
async def test_xp_never_below_zero():
    engine = EvolutionEngine()
    mission_fail = Mission(
        type=MissionType.ANALYSIS,
        payload={"prompt": "fail"},
        status=MissionStatus.FAILED,
    )
    for _ in range(5):
        await engine.tick(mission_fail)
    avatar = await engine.get_avatar()
    assert avatar.xp >= 0
