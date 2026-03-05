from __future__ import annotations

import importlib
from unittest.mock import AsyncMock

import pytest


@pytest.fixture
def forge(tmp_path, monkeypatch):
    manifest_module = importlib.import_module("core.self.manifest")
    forge_module = importlib.import_module("core.self.worker_forge")

    monkeypatch.setattr(
        manifest_module, "MANIFEST_PATH", tmp_path / "state" / "self_manifest.json"
    )
    monkeypatch.setattr(
        manifest_module, "GENERATED_UI_DIR", tmp_path / "panels" / "generated"
    )
    monkeypatch.setattr(
        manifest_module,
        "GENERATED_WORKER_DIR",
        tmp_path / "workers" / "generated",
    )

    fresh_manifest = manifest_module.SelfManifest()
    monkeypatch.setattr(
        forge_module, "GENERATED_WORKER_DIR", manifest_module.GENERATED_WORKER_DIR
    )
    monkeypatch.setattr(forge_module, "self_manifest", fresh_manifest)
    monkeypatch.setattr(forge_module.shadow_channel, "log", AsyncMock())
    monkeypatch.setattr(
        forge_module.rollback_engine,
        "create_checkpoint",
        AsyncMock(return_value={"id": "checkpoint"}),
    )
    monkeypatch.setattr(forge_module.rollback_engine, "rollback_to", AsyncMock())
    return forge_module.WorkerForge()


@pytest.mark.asyncio
async def test_forge_creates_file(forge, tmp_path):
    result = await forge.forge_worker(
        "TESTWORKER",
        "Test role",
        "TEST PREFIX",
        "mission-1",
    )
    assert result["success"] is True
    assert (tmp_path / "workers" / "generated" / "testworker_worker.py").exists()


@pytest.mark.asyncio
async def test_invalid_worker_name_rejected(forge):
    result = await forge.forge_worker(
        "invalid-name",
        "role",
        "prefix",
        "mission-1",
    )
    assert result["success"] is False


@pytest.mark.asyncio
async def test_worker_not_active_by_default(forge):
    result = await forge.forge_worker(
        "INACTIVEWORKER",
        "role",
        "prefix",
        "mission-1",
        activate=False,
    )
    assert result["active"] is False


@pytest.mark.asyncio
async def test_activate_worker_updates_manifest(forge):
    await forge.forge_worker("ACTIVATE_ME", "role", "prefix", "mission-1", activate=False)
    result = await forge.activate_worker("ACTIVATE_ME", "mission-2")
    assert result["success"] is True
    assert result["active"] is True
