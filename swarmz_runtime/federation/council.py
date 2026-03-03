"""NEXUSMON Federation Council — multi-agent registry and coordinated dispatch.

The FederationCouncil maintains a registry of named agents with their assigned
modes. When a coordination request is submitted, the council routes the goal
to every registered agent via the bridge in parallel and aggregates results.

Persistence: registration events and coordination snapshots are written to
artifacts/federation/{federation_id}.jsonl (coordination) and
artifacts/federation/registry.jsonl (agent registrations).
"""
from __future__ import annotations

import asyncio
import json
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

_ARTIFACTS_DIR = Path("artifacts/federation")
_REGISTRY_FILE = _ARTIFACTS_DIR / "registry.jsonl"


def _utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _coord_path(federation_id: str) -> Path:
    return _ARTIFACTS_DIR / f"{federation_id}.jsonl"


# ── Data models ───────────────────────────────────────────────────────────────


@dataclass
class AgentRegistration:
    """A registered federation agent with an assigned operating mode."""

    agent_id: str
    mode: str
    registered_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "mode": self.mode,
            "registered_at": self.registered_at,
        }


@dataclass
class AgentResult:
    """Result from one agent in a coordinated federation dispatch."""

    agent_id: str
    mode: str
    status: str           # "complete" | "error"
    output: str | None
    error: str | None
    tokens: int
    latency_ms: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "mode": self.mode,
            "status": self.status,
            "output": self.output,
            "error": self.error,
            "tokens": self.tokens,
            "latency_ms": round(self.latency_ms, 2),
        }


@dataclass
class CoordinationResult:
    """Aggregate result of a full federation coordination run."""

    federation_id: str
    goal: str
    agent_results: list[AgentResult]
    created_at: str
    completed_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "federation_id": self.federation_id,
            "goal": self.goal,
            "agent_results": [r.to_dict() for r in self.agent_results],
            "created_at": self.created_at,
            "completed_at": self.completed_at,
        }


# ── Persistence ───────────────────────────────────────────────────────────────


def _persist_line(path: Path, record: dict[str, Any]) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception:
        pass


# ── FederationCouncil ─────────────────────────────────────────────────────────


class AgentAlreadyRegistered(ValueError):
    """Raised when registering an agent_id that is already in the registry."""


class AgentNotFound(KeyError):
    """Raised when referencing an agent_id that has not been registered."""


class FederationCouncil:
    """Governs agent registration and coordinated multi-agent dispatch."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._agents: dict[str, AgentRegistration] = {}

    # ── Registration ─────────────────────────────────────────────────────────

    def register(self, agent_id: str, mode: str = "strategic") -> AgentRegistration:
        """Register an agent with the council.

        Raises AgentAlreadyRegistered if agent_id is already registered.
        """
        agent_id = agent_id.strip()
        mode = mode.strip()
        if not agent_id:
            raise ValueError("agent_id must not be empty")

        with self._lock:
            if agent_id in self._agents:
                raise AgentAlreadyRegistered(
                    f"Agent '{agent_id}' is already registered in the federation."
                )
            reg = AgentRegistration(
                agent_id=agent_id,
                mode=mode,
                registered_at=_utc(),
            )
            self._agents[agent_id] = reg

        _persist_line(_REGISTRY_FILE, {"_type": "register", **reg.to_dict()})
        return reg

    def deregister(self, agent_id: str) -> None:
        """Remove an agent from the registry.

        Raises AgentNotFound if agent_id is not registered.
        """
        with self._lock:
            if agent_id not in self._agents:
                raise AgentNotFound(
                    f"Agent '{agent_id}' is not registered in the federation."
                )
            del self._agents[agent_id]

        _persist_line(_REGISTRY_FILE, {"_type": "deregister", "agent_id": agent_id, "at": _utc()})

    def list_agents(self) -> list[AgentRegistration]:
        """Return a snapshot of all registered agents."""
        with self._lock:
            return list(self._agents.values())

    # ── Coordination ──────────────────────────────────────────────────────────

    async def coordinate(
        self,
        goal: str,
        budget_tokens: int = 2048,
    ) -> CoordinationResult:
        """Dispatch goal to all registered agents in parallel and aggregate results.

        If no agents are registered the result will have an empty agent_results list.
        Individual agent failures are captured in AgentResult.error — they do not
        propagate as exceptions from coordinate().
        """
        federation_id = uuid4().hex[:12]
        created_at = _utc()

        with self._lock:
            agents_snapshot = list(self._agents.values())

        _persist_line(
            _coord_path(federation_id),
            {
                "_type": "coordination_start",
                "federation_id": federation_id,
                "goal": goal,
                "agent_count": len(agents_snapshot),
                "created_at": created_at,
            },
        )

        tasks = [
            self._dispatch_agent(reg, goal, budget_tokens)
            for reg in agents_snapshot
        ]
        agent_results: list[AgentResult] = await asyncio.gather(*tasks)

        completed_at = _utc()
        result = CoordinationResult(
            federation_id=federation_id,
            goal=goal,
            agent_results=list(agent_results),
            created_at=created_at,
            completed_at=completed_at,
        )

        _persist_line(
            _coord_path(federation_id),
            {"_type": "coordination_complete", **result.to_dict()},
        )

        # Award XP to each agent that succeeded
        for ar in agent_results:
            if ar.status == "complete":
                try:
                    from swarmz_runtime.evolution.engine import award_xp
                    xp = max(1, int(ar.tokens / 100))
                    award_xp(ar.agent_id, xp, f"federation:{federation_id}")
                except Exception:
                    pass

        return result

    async def _dispatch_agent(
        self,
        reg: AgentRegistration,
        goal: str,
        budget_tokens: int,
    ) -> AgentResult:
        start = time.perf_counter()
        try:
            from swarmz_runtime.bridge.llm import call_v2
            bridge = await call_v2(
                prompt=goal,
                mode=reg.mode,
                context={
                    "agent_id": reg.agent_id,
                    "system": (
                        f"You are NEXUSMON federation agent {reg.agent_id}. "
                        "Execute the coordinated goal with precision."
                    ),
                },
                budget_tokens=budget_tokens,
            )
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return AgentResult(
                agent_id=reg.agent_id,
                mode=reg.mode,
                status="complete",
                output=bridge.content,
                error=None,
                tokens=bridge.tokens_used,
                latency_ms=latency_ms,
            )
        except Exception as exc:
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return AgentResult(
                agent_id=reg.agent_id,
                mode=reg.mode,
                status="error",
                output=None,
                error=str(exc),
                tokens=0,
                latency_ms=latency_ms,
            )


# ── Singleton ─────────────────────────────────────────────────────────────────

_COUNCIL: FederationCouncil | None = None
_COUNCIL_LOCK = threading.Lock()


def get_council() -> FederationCouncil:
    """Return the process-level FederationCouncil singleton."""
    global _COUNCIL
    if _COUNCIL is None:
        with _COUNCIL_LOCK:
            if _COUNCIL is None:
                _COUNCIL = FederationCouncil()
    return _COUNCIL
