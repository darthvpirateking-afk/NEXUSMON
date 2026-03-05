from __future__ import annotations

import json
from pathlib import Path

import pytest

import core.shadow.channel as channel_module
from core.shadow.channel import ShadowChannel


@pytest.fixture
def channel(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    log_path = tmp_path / "test_audit.jsonl"
    monkeypatch.setattr(channel_module, "SHADOW_LOG", log_path)
    return ShadowChannel(), log_path


@pytest.mark.asyncio
async def test_log_writes_entry(channel):
    shadow, log_path = channel
    await shadow.log("test_event", "mission-123", {"key": "value"})
    assert log_path.exists()
    lines = [line for line in log_path.read_text(encoding="utf-8").splitlines() if line]
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["event_type"] == "test_event"
    assert entry["mission_id"] == "mission-123"


@pytest.mark.asyncio
async def test_log_is_append_only(channel):
    shadow, log_path = channel
    await shadow.log("event_1", "m-1", {})
    await shadow.log("event_2", "m-1", {})
    lines = [line for line in log_path.read_text(encoding="utf-8").splitlines() if line]
    assert len(lines) == 2


@pytest.mark.asyncio
async def test_get_by_mission_filters(channel):
    shadow, _ = channel
    await shadow.log("event", "mission-A", {"x": 1})
    await shadow.log("event", "mission-B", {"x": 2})
    results = await shadow.get_by_mission("mission-A")
    assert len(results) == 1
    assert results[0]["mission_id"] == "mission-A"


@pytest.mark.asyncio
async def test_get_recent_respects_limit(channel):
    shadow, _ = channel
    for idx in range(10):
        await shadow.log("event", f"m-{idx}", {})
    results = await shadow.get_recent(limit=5)
    assert len(results) == 5
