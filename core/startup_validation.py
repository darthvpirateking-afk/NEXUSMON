"""Startup contract validation for runtime config and required schemas."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Iterable


REQUIRED_RUNTIME_KEYS: tuple[str, ...] = ("config_version", "llm", "routing", "models")
REQUIRED_SCHEMA_PATHS: tuple[str, ...] = ("schemas/agent-manifest.v1.json",)
DEFAULT_DEV_CORS_ORIGINS: tuple[str, ...] = (
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
)
_TRUTHY: frozenset[str] = frozenset({"1", "true", "yes", "on"})


def _missing_keys(payload: dict, required_keys: Iterable[str]) -> list[str]:
    return [key for key in required_keys if key not in payload]


def env_truthy(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in _TRUTHY


def is_production_environment() -> bool:
    env_value = (
        os.environ.get("APP_ENV")
        or os.environ.get("ENVIRONMENT")
        or os.environ.get("SWARMZ_ENV")
        or os.environ.get("RAILWAY_ENVIRONMENT")
        or ("production" if os.environ.get("RENDER") else "")
    )
    return str(env_value).strip().lower() in {"production", "prod"}


def should_enforce_security_contract() -> bool:
    return env_truthy("ENFORCE_SECURITY_CONTRACT", False) or is_production_environment()


def parse_cors_origins(
    raw_value: str | None,
    default_origins: Iterable[str] = DEFAULT_DEV_CORS_ORIGINS,
) -> list[str]:
    origins = [o.strip() for o in (raw_value or "").split(",") if o.strip()]
    if not origins:
        origins = list(default_origins)

    unique_origins: list[str] = []
    seen: set[str] = set()
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            unique_origins.append(origin)
    return unique_origins


def validate_security_env(enforce: bool = False) -> dict[str, object]:
    missing_env: list[str] = []
    if not os.environ.get("OPERATOR_KEY", "").strip():
        missing_env.append("OPERATOR_KEY")
    if not (
        os.environ.get("JWT_SECRET", "").strip()
        or os.environ.get("SWARMZ_JWT_SECRET", "").strip()
    ):
        missing_env.append("JWT_SECRET|SWARMZ_JWT_SECRET")

    if enforce and missing_env:
        raise RuntimeError(
            "FATAL: missing required security env vars: " + ", ".join(missing_env)
        )

    return {"missing_env": missing_env, "enforced": enforce}


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
