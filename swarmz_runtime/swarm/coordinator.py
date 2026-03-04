"""NEXUSMON Swarm Coordinator — multi-agent spawn, route, track.

Each spawn request creates a new swarm identified by swarm_id and routes
the agent goal through the bridge using the specified mode.
All swarm state is persisted to artifacts/swarm/{swarm_id}.jsonl.
"""

from __future__ import annotations

import json
import threading
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

_ARTIFACTS_DIR = Path("artifacts/swarm")


def _utc() -> str:
    return datetime.now(UTC).isoformat()


def _swarm_path(swarm_id: str) -> Path:
    return _ARTIFACTS_DIR / f"{swarm_id}.jsonl"


# ── Data models ───────────────────────────────────────────────────────────────


@dataclass
class SpawnRequest:
    """Request to spawn an agent into a new swarm."""

    agent_id: str
    goal: str
    mode: str = "strategic"
    constraints: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentState:
    """State of a single agent within a swarm."""

    agent_id: str
    swarm_id: str
    goal: str
    mode: str
    status: str  # "running" | "complete" | "error"
    output: str | None
    error: str | None
    tokens: int
    latency_ms: float
    spawned_at: str
    completed_at: str | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "swarm_id": self.swarm_id,
            "goal": self.goal,
            "mode": self.mode,
            "status": self.status,
            "output": self.output,
            "error": self.error,
            "tokens": self.tokens,
            "latency_ms": round(self.latency_ms, 2),
            "spawned_at": self.spawned_at,
            "completed_at": self.completed_at,
        }


@dataclass
class SwarmState:
    """Aggregate state of a swarm (one or more agents)."""

    swarm_id: str
    agents: list[AgentState]
    created_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "swarm_id": self.swarm_id,
            "agents": [a.to_dict() for a in self.agents],
            "created_at": self.created_at,
        }


# ── Persistence ───────────────────────────────────────────────────────────────


def _persist_event(swarm_id: str, record: dict[str, Any]) -> None:
    try:
        path = _swarm_path(swarm_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception:
        pass


def _load_swarm_from_disk(swarm_id: str) -> SwarmState | None:
    """Reconstruct SwarmState from the last snapshot in its JSONL file."""
    path = _swarm_path(swarm_id)
    if not path.exists():
        return None
    try:
        lines = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
        for line in reversed(lines):
            d = json.loads(line)
            if d.get("_type") == "snapshot":
                agents = [AgentState(**a) for a in d.get("agents", [])]
                return SwarmState(
                    swarm_id=d["swarm_id"],
                    agents=agents,
                    created_at=d["created_at"],
                )
    except Exception:
        pass
    return None


# ── Coordinator ───────────────────────────────────────────────────────────────


class SwarmCoordinator:
    """Governs multi-agent spawning, routing, and tracking."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._swarms: dict[str, SwarmState] = {}

    async def spawn(self, request: SpawnRequest) -> tuple[str, AgentState]:
        """Create a new swarm, spawn one agent, route its goal to the bridge.

        Returns (swarm_id, AgentState). The agent state reflects the final
        outcome — complete or error — after bridge routing completes.
        """
        swarm_id = uuid4().hex[:12]
        ts = _utc()

        agent = AgentState(
            agent_id=request.agent_id,
            swarm_id=swarm_id,
            goal=request.goal,
            mode=request.mode,
            status="running",
            output=None,
            error=None,
            tokens=0,
            latency_ms=0.0,
            spawned_at=ts,
            completed_at=None,
        )
        swarm = SwarmState(swarm_id=swarm_id, agents=[agent], created_at=ts)

        with self._lock:
            self._swarms[swarm_id] = swarm

        _persist_event(
            swarm_id,
            {
                "_type": "spawn",
                "agent_id": request.agent_id,
                "goal": request.goal,
                "mode": request.mode,
                "spawned_at": ts,
            },
        )

        budget = int(request.constraints.get("max_tokens", 2048))
        start = time.perf_counter()

        try:
            from swarmz_runtime.bridge.llm import call_v2

            bridge = await call_v2(
                prompt=request.goal,
                mode=request.mode,
                context={
                    "agent_id": request.agent_id,
                    "system": (
                        f"You are NEXUSMON agent {request.agent_id}. "
                        "Execute your assigned goal with precision."
                    ),
                },
                budget_tokens=budget,
            )
            agent.status = "complete"
            agent.output = bridge.content
            agent.tokens = bridge.tokens_used
            agent.latency_ms = round((time.perf_counter() - start) * 1000, 2)
            agent.completed_at = _utc()

        except Exception as exc:
            agent.status = "error"
            agent.error = str(exc)
            agent.latency_ms = round((time.perf_counter() - start) * 1000, 2)
            agent.completed_at = _utc()

        # Persist final snapshot for disk recovery
        _persist_event(swarm_id, {"_type": "snapshot", **swarm.to_dict()})

        # Award XP to the agent after successful swarm execution
        if agent.status == "complete":
            try:
                from swarmz_runtime.evolution.engine import award_xp

                xp = max(1, int(agent.tokens / 100))
                award_xp(request.agent_id, xp, f"swarm:{swarm_id}")
            except Exception:
                pass

        return swarm_id, agent

    def track(self, swarm_id: str) -> SwarmState | None:
        """Return the current state for a swarm by ID.

        Checks in-memory first; falls back to disk for historical swarms.
        """
        with self._lock:
            swarm = self._swarms.get(swarm_id)
        if swarm is not None:
            return swarm
        return _load_swarm_from_disk(swarm_id)


# ── Singleton ─────────────────────────────────────────────────────────────────

_COORDINATOR: SwarmCoordinator | None = None
_COORD_LOCK = threading.Lock()


def get_coordinator() -> SwarmCoordinator:
    """Return the process-level SwarmCoordinator singleton."""
    global _COORDINATOR
    if _COORDINATOR is None:
        with _COORD_LOCK:
            if _COORDINATOR is None:
                _COORDINATOR = SwarmCoordinator()
    return _COORDINATOR
