from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator

SHADOW_LOG = Path("artifacts/shadow/audit.jsonl")


class ShadowChannel:
    def __init__(self) -> None:
        SHADOW_LOG.parent.mkdir(parents=True, exist_ok=True)
        self._subscribers: list[asyncio.Queue[dict[str, Any]]] = []

    async def log(
        self,
        event_type: str,
        mission_id: str,
        data: Any,
        operator_id: str | None = None,
    ) -> None:
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "mission_id": mission_id,
            "operator_id": operator_id,
            "data": data if isinstance(data, dict) else {"value": str(data)},
        }
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._append, json.dumps(entry))

        dead: list[asyncio.Queue[dict[str, Any]]] = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(entry)
            except asyncio.QueueFull:
                dead.append(queue)
        for queue in dead:
            if queue in self._subscribers:
                self._subscribers.remove(queue)

    def _append(self, line: str) -> None:
        with open(SHADOW_LOG, "a", encoding="utf-8") as handle:
            handle.write(line + "\n")

    async def tail(self) -> AsyncGenerator[dict[str, Any], None]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=500)
        self._subscribers.append(queue)
        try:
            while True:
                entry = await queue.get()
                yield entry
        finally:
            if queue in self._subscribers:
                self._subscribers.remove(queue)

    async def get_by_mission(self, mission_id: str) -> list[dict[str, Any]]:
        if not SHADOW_LOG.exists():
            return []
        loop = asyncio.get_event_loop()
        lines = await loop.run_in_executor(None, SHADOW_LOG.read_text)
        results: list[dict[str, Any]] = []
        for line in lines.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get("mission_id") == mission_id:
                results.append(entry)
        return results

    async def get_recent(self, limit: int = 100) -> list[dict[str, Any]]:
        if not SHADOW_LOG.exists():
            return []
        loop = asyncio.get_event_loop()
        lines = await loop.run_in_executor(None, SHADOW_LOG.read_text)
        entries: list[dict[str, Any]] = []
        for line in lines.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries[-limit:]


shadow_channel = ShadowChannel()
