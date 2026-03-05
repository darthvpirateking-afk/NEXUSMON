# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
"""Deployment and mobile readiness status helpers for v2.2.0."""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Mapping


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def _as_bool(raw: Any) -> bool:
    if isinstance(raw, bool):
        return raw
    if raw is None:
        return False
    return str(raw).strip().lower() in {"1", "true", "yes", "on"}


def _load_mobile_access(root_dir: Path) -> dict[str, Any]:
    config_path = root_dir / "config.json"
    if not config_path.exists():
        return {"enabled": False, "port": None, "source": "missing"}

    try:
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        return {"enabled": False, "port": None, "source": "invalid"}

    mobile_access = payload.get("mobile_access", {}) if isinstance(payload, dict) else {}
    enabled = _as_bool(mobile_access.get("enabled")) if isinstance(mobile_access, dict) else False
    port = mobile_access.get("port") if isinstance(mobile_access, dict) else None
    return {"enabled": enabled, "port": port, "source": "config.json"}


def _detect_platform(env: Mapping[str, str], root_dir: Path) -> str:
    if env.get("RENDER") or (root_dir / "render.yaml").exists():
        return "render"
    if env.get("RAILWAY_ENVIRONMENT") or env.get("RAILWAY_STATIC_URL"):
        return "railway"
    return "local"


def _resolve_public_url(env: Mapping[str, str], default_port: int) -> str:
    if env.get("BASE_URL"):
        return str(env["BASE_URL"]).rstrip("/")
    if env.get("RENDER_EXTERNAL_URL"):
        return str(env["RENDER_EXTERNAL_URL"]).rstrip("/")
    if env.get("RAILWAY_STATIC_URL"):
        return f"https://{str(env['RAILWAY_STATIC_URL']).strip('/')}"
    return f"http://127.0.0.1:{default_port}"


def get_deployment_mobile_status(
    root_dir: Path,
    default_port: int,
    env: Mapping[str, str] | None = None,
) -> dict[str, Any]:
    """Return deterministic deployment + mobile readiness summary."""
    active_env = env or os.environ
    mobile_access = _load_mobile_access(root_dir)
    platform = _detect_platform(active_env, root_dir)
    public_url = _resolve_public_url(active_env, default_port)

    wrapper_root = root_dir / "mobile" / "app_store_wrapper"
    capacitor_config = wrapper_root / "capacitor.config.json"

    return {
        "ok": True,
        "timestamp": _utc_now_iso(),
        "deployment": {
            "platform": platform,
            "public_url": public_url,
            "has_render_yaml": (root_dir / "render.yaml").exists(),
            "has_railway_json": (root_dir / "railway.json").exists(),
            "is_cloud_hint": platform in {"render", "railway"},
        },
        "mobile": {
            "mobile_access": mobile_access,
            "has_capacitor_wrapper": wrapper_root.exists(),
            "has_capacitor_config": capacitor_config.exists(),
            "recommended_manifest": f"{public_url}/pwa/manifest.json",
            "recommended_start": f"{public_url}/console",
        },
    }
