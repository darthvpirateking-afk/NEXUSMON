from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

MANIFEST_PATH = Path("artifacts/state/self_manifest.json")
GENERATED_UI_DIR = Path("cockpit/src/panels/generated")
GENERATED_WORKER_DIR = Path("core/orchestrator/workers/generated")


class SelfManifest:
    def __init__(self) -> None:
        MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
        GENERATED_UI_DIR.mkdir(parents=True, exist_ok=True)
        GENERATED_WORKER_DIR.mkdir(parents=True, exist_ok=True)
        self._data = self._load()

    def _load(self) -> dict:
        if MANIFEST_PATH.exists():
            try:
                return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {
            "generated_panels": [],
            "generated_workers": [],
            "active_workers": [],
            "modification_count": 0,
            "last_modified": None,
        }

    def _save(self) -> None:
        self._data["last_modified"] = datetime.utcnow().isoformat()
        MANIFEST_PATH.write_text(
            json.dumps(self._data, indent=2),
            encoding="utf-8",
        )

    def register_panel(self, name: str, path: str) -> None:
        entry = {
            "name": name,
            "path": path,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._data["generated_panels"].append(entry)
        self._data["modification_count"] += 1
        self._save()

    def register_worker(self, name: str, path: str, active: bool = False) -> None:
        entry = {
            "name": name,
            "path": path,
            "active": active,
            "created_at": datetime.utcnow().isoformat(),
        }
        existing = [worker for worker in self._data["generated_workers"] if worker["name"] != name]
        existing.append(entry)
        self._data["generated_workers"] = existing
        if active and name not in self._data["active_workers"]:
            self._data["active_workers"].append(name)
        self._save()

    def activate_worker(self, name: str) -> None:
        for worker in self._data["generated_workers"]:
            if worker["name"] == name:
                worker["active"] = True
        if name not in self._data["active_workers"]:
            self._data["active_workers"].append(name)
        self._save()

    def get_all(self) -> dict:
        return self._data


self_manifest = SelfManifest()
