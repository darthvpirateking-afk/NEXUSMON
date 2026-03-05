from __future__ import annotations

import json
from pathlib import Path

from core.models.avatar import CapabilityFlags

FLAGS_PATH = Path("artifacts/state/capability_flags.json")


class CapabilityFlagStore:
    def __init__(self) -> None:
        FLAGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._flags = self._load()

    def _load(self) -> CapabilityFlags:
        if FLAGS_PATH.exists():
            return CapabilityFlags(**json.loads(FLAGS_PATH.read_text()))
        return CapabilityFlags()

    def _save(self) -> None:
        FLAGS_PATH.write_text(self._flags.model_dump_json(indent=2))

    def is_enabled(self, flag: str) -> bool:
        return getattr(self._flags, flag, False)

    def enable(self, flag: str) -> None:
        if hasattr(self._flags, flag):
            setattr(self._flags, flag, True)
            self._save()

    def disable(self, flag: str) -> None:
        if hasattr(self._flags, flag):
            setattr(self._flags, flag, False)
            self._save()

    def get_all(self) -> CapabilityFlags:
        return self._flags

    def reset(self) -> None:
        self._flags = CapabilityFlags()
        self._save()


capability_flags = CapabilityFlagStore()
