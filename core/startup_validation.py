"""Startup contract validation for runtime config and required schemas."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable


REQUIRED_RUNTIME_KEYS: tuple[str, ...] = ("config_version", "llm", "routing", "models")
REQUIRED_SCHEMA_PATHS: tuple[str, ...] = ("schemas/agent-manifest.v1.json",)


def _missing_keys(payload: dict, required_keys: Iterable[str]) -> list[str]:
    return [key for key in required_keys if key not in payload]


def validate_startup_contract(repo_root: Path | None = None) -> dict[str, object]:
    """Validate required boot-time files and runtime config structure.

    Raises:
        RuntimeError: when config/schema requirements are not met.
    """

    root = repo_root or Path(__file__).resolve().parents[1]
    runtime_path = root / "config" / "runtime.json"

    if not runtime_path.exists():
        raise RuntimeError(f"FATAL: missing runtime config: {runtime_path}")

    try:
        runtime_payload = json.loads(runtime_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"FATAL: invalid runtime config JSON: {runtime_path}") from exc

    if not isinstance(runtime_payload, dict):
        raise RuntimeError(f"FATAL: runtime config must be an object: {runtime_path}")

    missing_runtime_keys = _missing_keys(runtime_payload, REQUIRED_RUNTIME_KEYS)
    if missing_runtime_keys:
        raise RuntimeError(
            "FATAL: runtime config missing keys: "
            + ", ".join(sorted(missing_runtime_keys))
        )

    missing_schema_paths = [
        rel for rel in REQUIRED_SCHEMA_PATHS if not (root / rel).exists()
    ]
    if missing_schema_paths:
        raise RuntimeError(
            "FATAL: required schema files missing: "
            + ", ".join(sorted(missing_schema_paths))
        )

    return {
        "runtime_path": str(runtime_path),
        "config_version": runtime_payload.get("config_version"),
        "required_keys": list(REQUIRED_RUNTIME_KEYS),
        "required_schemas": list(REQUIRED_SCHEMA_PATHS),
    }
