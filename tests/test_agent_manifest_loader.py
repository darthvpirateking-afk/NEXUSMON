"""Regression tests for manifest autoload scope in core.agent_manifest."""
from __future__ import annotations

import json

import pytest

from core.agent_manifest import REGISTRY, get_agent, load_manifests_from_dir


def _valid_manifest(agent_id: str = "helper1@0.1.0") -> dict[str, object]:
    return {
        "id": agent_id,
        "version": "0.1.0",
        "capabilities": ["data.read", "agent.introspect"],
        "inputs": {"query": {"type": "string", "required": True}},
        "outputs": {"result": {"type": "object", "required": True}},
        "spawn_policy": "ephemeral",
        "constraints": {
            "max_memory_mb": 128,
            "max_cpu_percent": 10,
            "max_spawn_depth": 1,
            "network_access": False,
            "filesystem_access": "none",
            "allowed_capabilities": ["data.read", "agent.introspect"],
            "trust_level": 0.9,
        },
        "error_modes": {
            "on_validation_failure": "reject",
            "on_dependency_missing": "defer",
            "on_runtime_exception": "fallback",
            "max_retries": 0,
        },
    }


def test_load_manifests_from_dir_ignores_non_manifest_json(tmp_path) -> None:
    REGISTRY.clear()
    try:
        (tmp_path / "helper1.manifest.json").write_text(
            json.dumps(_valid_manifest()),
            encoding="utf-8",
        )
        # Intentionally invalid for v1; should be ignored due non-manifest suffix.
        (tmp_path / "fetcher@1.0.0.json").write_text(
            json.dumps(
                {
                    "id": "fetcher@1.0.0",
                    "version": "1.0.0",
                    "capabilities": ["data.fetch"],
                    "spawn_policy": "auto",
                    "error_modes": {"on_validation_failure": "reject"},
                }
            ),
            encoding="utf-8",
        )

        loaded = load_manifests_from_dir(tmp_path)
        assert [manifest.id for manifest in loaded] == ["helper1@0.1.0"]
        assert get_agent("helper1") is not None
        assert get_agent("fetcher") is None
    finally:
        REGISTRY.clear()


def test_load_manifests_from_dir_keeps_validation_for_manifest_suffix(tmp_path) -> None:
    REGISTRY.clear()
    try:
        (tmp_path / "broken.manifest.json").write_text(
            json.dumps(
                {
                    "id": "broken@1.0.0",
                    "version": "1.0.0",
                    "capabilities": ["data.read"],
                    "inputs": {},
                    "outputs": {},
                    "spawn_policy": "auto",
                    "constraints": {},
                    "error_modes": {"on_validation_failure": "reject"},
                }
            ),
            encoding="utf-8",
        )

        with pytest.raises(ValueError):
            load_manifests_from_dir(tmp_path)
    finally:
        REGISTRY.clear()

