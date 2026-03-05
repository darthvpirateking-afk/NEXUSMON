from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field

CHECKPOINT_DIR = Path("artifacts/checkpoints")


class Checkpoint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    mission_id: str
    state_snapshot: dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)


def _write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


class RollbackEngine:
    def __init__(self) -> None:
        CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

    async def create_checkpoint(
        self, mission_id: str, state: dict[str, Any]
    ) -> Checkpoint:
        checkpoint = Checkpoint(mission_id=mission_id, state_snapshot=state)
        path = CHECKPOINT_DIR / f"{checkpoint.id}.json"
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, _write_text, path, checkpoint.model_dump_json(indent=2)
        )
        return checkpoint

    async def rollback_to(self, checkpoint: Checkpoint) -> dict[str, Any]:
        return checkpoint.state_snapshot

    async def list_checkpoints(self, mission_id: str) -> list[Checkpoint]:
        loop = asyncio.get_event_loop()

        def _read() -> list[Checkpoint]:
            items: list[Checkpoint] = []
            for file in CHECKPOINT_DIR.glob("*.json"):
                try:
                    checkpoint = Checkpoint(
                        **json.loads(file.read_text(encoding="utf-8"))
                    )
                    if checkpoint.mission_id == mission_id:
                        items.append(checkpoint)
                except Exception:
                    continue
            return sorted(items, key=lambda cp: cp.created_at)

        return await loop.run_in_executor(None, _read)

    async def prune_old(self, max_age_hours: int = 24) -> int:
        import time

        cutoff = time.time() - (max_age_hours * 3600)
        loop = asyncio.get_event_loop()

        def _prune() -> int:
            count = 0
            for file in CHECKPOINT_DIR.glob("*.json"):
                if file.stat().st_mtime < cutoff:
                    file.unlink()
                    count += 1
            return count

        return await loop.run_in_executor(None, _prune)


rollback_engine = RollbackEngine()
