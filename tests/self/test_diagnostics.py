from __future__ import annotations

import subprocess
from unittest.mock import AsyncMock

import pytest

from core.self.diagnostics import SelfDiagnostics


@pytest.fixture
def diag(monkeypatch):
    import core.self.diagnostics as diag_module

    monkeypatch.setattr(diag_module.shadow_channel, "log", AsyncMock())
    return SelfDiagnostics()


@pytest.mark.asyncio
async def test_read_error_log_returns_dict(diag, monkeypatch):
    import core.self.diagnostics as diag_module

    monkeypatch.setattr(
        diag_module.shadow_channel,
        "get_recent",
        AsyncMock(
            return_value=[
                {"event_type": "failure"},
                {"event_type": "status_change"},
            ]
        ),
    )
    result = await diag.read_error_log(limit=10)
    assert "failures" in result
    assert "failure_count" in result
    assert result["failure_count"] == 1


@pytest.mark.asyncio
async def test_run_tests_returns_result(diag, monkeypatch):
    import core.self.diagnostics as diag_module

    def _fake_run(*args, **kwargs):
        return subprocess.CompletedProcess(
            args=["pytest"],
            returncode=0,
            stdout="2 passed in 0.12s",
            stderr="",
        )

    monkeypatch.setattr(diag_module.subprocess, "run", _fake_run)
    result = await diag.run_tests("test-mission", scope="tests/self/")
    assert "passed" in result
    assert "output" in result
    assert result["passed"] is True


@pytest.mark.asyncio
async def test_health_report_includes_avatar_and_failures(diag, monkeypatch):
    monkeypatch.setattr(
        diag,
        "read_error_log",
        AsyncMock(
            return_value={
                "total_entries": 3,
                "failure_count": 1,
                "failures": [{"event_type": "failure"}],
            }
        ),
    )
    monkeypatch.setattr(
        diag,
        "run_tests",
        AsyncMock(return_value={"passed": True, "output": "ok"}),
    )

    import core.evolution.engine as evo_module

    monkeypatch.setattr(
        evo_module.evolution_engine,
        "get_xp_summary",
        AsyncMock(return_value={"rank": "AWAKENING", "xp": 500}),
    )

    result = await diag.health_report("mission-health")
    assert "health" in result
    assert result["health"]["tests_passing"] is True
    assert result["health"]["failure_count"] == 1
    assert result["health"]["avatar_rank"] == "AWAKENING"
