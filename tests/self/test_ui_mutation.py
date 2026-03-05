from __future__ import annotations

from unittest.mock import AsyncMock

import pytest


@pytest.fixture
def engine(tmp_path, monkeypatch):
    import core.self.manifest as manifest_module
    import core.self.ui_mutation as ui_module

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
    monkeypatch.setattr(ui_module, "GENERATED_UI_DIR", manifest_module.GENERATED_UI_DIR)
    monkeypatch.setattr(ui_module, "self_manifest", fresh_manifest)
    monkeypatch.setattr(ui_module.shadow_channel, "log", AsyncMock())
    monkeypatch.setattr(
        ui_module.rollback_engine,
        "create_checkpoint",
        AsyncMock(return_value={"id": "checkpoint"}),
    )
    monkeypatch.setattr(ui_module.rollback_engine, "rollback_to", AsyncMock())
    return ui_module.UIMutationEngine()


@pytest.mark.asyncio
async def test_generate_panel_creates_file(engine, tmp_path):
    result = await engine.generate_panel("TestPanel", "A test panel", "mission-1")
    assert result["success"] is True
    assert (tmp_path / "panels" / "generated" / "TestPanel.tsx").exists()


@pytest.mark.asyncio
async def test_invalid_panel_name_rejected(engine):
    result = await engine.generate_panel("invalid-name!", "desc", "mission-1")
    assert result["success"] is False


@pytest.mark.asyncio
async def test_style_patch_allowed_prop(engine):
    result = await engine.apply_style_patch("color", "#00ff88", ".panel", "mission-1")
    assert result["success"] is True


@pytest.mark.asyncio
async def test_style_patch_blocked_prop(engine):
    result = await engine.apply_style_patch("z-index", "9999", ".panel", "mission-1")
    assert result["success"] is False
