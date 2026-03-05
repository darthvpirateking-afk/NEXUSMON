from __future__ import annotations

import asyncio
import json
from pathlib import Path

from core.models.artifact import Artifact

VAULT_DIR = Path("artifacts/vault")


def _write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


class ArtifactVault:
    def __init__(self) -> None:
        VAULT_DIR.mkdir(parents=True, exist_ok=True)

    async def seal(self, mission_id: str, content: dict) -> Artifact:
        artifact = Artifact(mission_id=mission_id, content=content)
        artifact.seal()
        path = VAULT_DIR / f"{artifact.id}.json"
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            _write_text,
            path,
            artifact.model_dump_json(indent=2),
        )
        return artifact

    async def get(self, artifact_id: str) -> Artifact | None:
        path = VAULT_DIR / f"{artifact_id}.json"
        if not path.exists():
            return None
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(None, path.read_text, "utf-8")
        return Artifact(**json.loads(text))

    async def list_by_mission(self, mission_id: str) -> list[Artifact]:
        loop = asyncio.get_event_loop()

        def _read_all() -> list[Artifact]:
            items: list[Artifact] = []
            for file in VAULT_DIR.glob("*.json"):
                try:
                    artifact = Artifact(**json.loads(file.read_text(encoding="utf-8")))
                    if artifact.mission_id == mission_id:
                        items.append(artifact)
                except Exception:
                    continue
            return items

        results = await loop.run_in_executor(None, _read_all)
        return sorted(results, key=lambda item: item.created_at)


artifact_vault = ArtifactVault()
