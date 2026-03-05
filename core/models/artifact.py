from __future__ import annotations

import hashlib
import json
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class ArtifactStatus(str, Enum):
    PENDING = "pending"
    SEALED = "sealed"
    CORRUPT = "corrupt"


class Artifact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    mission_id: str
    status: ArtifactStatus = ArtifactStatus.PENDING
    content: Any
    content_type: str = "application/json"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sealed_at: datetime | None = None
    checksum: str | None = None
    size_bytes: int = 0
    tags: list[str] = Field(default_factory=list)

    def seal(self) -> Artifact:
        content_str = json.dumps(self.content, sort_keys=True, default=str)
        self.checksum = hashlib.sha256(content_str.encode()).hexdigest()
        self.sealed_at = datetime.utcnow()
        self.size_bytes = len(content_str.encode())
        self.status = ArtifactStatus.SEALED
        return self
