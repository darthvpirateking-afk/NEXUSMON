from __future__ import annotations

import json
from pathlib import Path

from swarmz_runtime.api.deployment_mobile_status import get_deployment_mobile_status


def test_mobile_status_local_defaults(tmp_path: Path):
    status = get_deployment_mobile_status(root_dir=tmp_path, default_port=8000, env={})

    assert status["ok"] is True
    assert status["deployment"]["platform"] == "local"
    assert status["deployment"]["public_url"] == "http://127.0.0.1:8000"
    assert status["mobile"]["mobile_access"]["enabled"] is False
    assert status["mobile"]["mobile_access"]["source"] == "missing"


def test_mobile_status_render_detection(tmp_path: Path):
    (tmp_path / "render.yaml").write_text("services: []\n", encoding="utf-8")

    status = get_deployment_mobile_status(
        root_dir=tmp_path,
        default_port=8000,
        env={"RENDER_EXTERNAL_URL": "https://nexusmon.example.onrender.com/"},
    )

    assert status["deployment"]["platform"] == "render"
    assert status["deployment"]["public_url"] == "https://nexusmon.example.onrender.com"
    assert status["deployment"]["has_render_yaml"] is True


def test_mobile_status_reads_mobile_access_config(tmp_path: Path):
    config = {
        "mobile_access": {
            "enabled": True,
            "port": 8765,
        }
    }
    (tmp_path / "config.json").write_text(json.dumps(config), encoding="utf-8")

    status = get_deployment_mobile_status(root_dir=tmp_path, default_port=8000, env={})

    assert status["mobile"]["mobile_access"]["enabled"] is True
    assert status["mobile"]["mobile_access"]["port"] == 8765
    assert status["mobile"]["mobile_access"]["source"] == "config.json"


def test_mobile_status_detects_capacitor_wrapper(tmp_path: Path):
    wrapper = tmp_path / "mobile" / "app_store_wrapper"
    wrapper.mkdir(parents=True)
    (wrapper / "capacitor.config.json").write_text("{}", encoding="utf-8")

    status = get_deployment_mobile_status(root_dir=tmp_path, default_port=8000, env={})

    assert status["mobile"]["has_capacitor_wrapper"] is True
    assert status["mobile"]["has_capacitor_config"] is True
