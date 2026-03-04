"""NEXUSMON Command Fusion — dependency-aware parallel step execution.

Steps without dependencies run in parallel via asyncio.gather.
Steps with depends_on wait for their prerequisites to complete first.
All fusion runs produce JSONL artifacts.
"""

from __future__ import annotations

import asyncio
import json
import secrets
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

_ARTIFACTS_DIR = Path("artifacts/fusion")
_LOCK = threading.Lock()
_COMMAND_FUSION: CommandFusion | None = None

# ── Built-in presets ──────────────────────────────────────────────────────────

PRESETS: dict[str, dict[str, Any]] = {
    "FORGE": {
        "name": "FORGE",
        "description": "Mission → Swarm → Evolve",
        "steps": [
            {"step_id": "forge-1", "action": "mission", "params": {"goal": ""}, "depends_on": None},
            {
                "step_id": "forge-2",
                "action": "swarm",
                "params": {"goal": ""},
                "depends_on": ["forge-1"],
            },
            {"step_id": "forge-3", "action": "evolve", "params": {}, "depends_on": ["forge-2"]},
        ],
    },
    "DEPLOY": {
        "name": "DEPLOY",
        "description": "Kernel → Federation → Companion",
        "steps": [
            {"step_id": "deploy-1", "action": "kernel", "params": {}, "depends_on": None},
            {
                "step_id": "deploy-2",
                "action": "federation",
                "params": {"goal": ""},
                "depends_on": ["deploy-1"],
            },
            {
                "step_id": "deploy-3",
                "action": "companion",
                "params": {"prompt": ""},
                "depends_on": None,
            },
        ],
    },
    "IGNITE": {
        "name": "IGNITE",
        "description": "Full system boot sequence",
        "steps": [
            {"step_id": "ignite-1", "action": "kernel", "params": {}, "depends_on": None},
            {
                "step_id": "ignite-2",
                "action": "swarm",
                "params": {"goal": "system boot"},
                "depends_on": ["ignite-1"],
            },
            {
                "step_id": "ignite-3",
                "action": "federation",
                "params": {"goal": "system ready"},
                "depends_on": ["ignite-1"],
            },
            {
                "step_id": "ignite-4",
                "action": "companion",
                "params": {"prompt": "system online"},
                "depends_on": ["ignite-2", "ignite-3"],
            },
        ],
    },
}


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class FusionStep:
    step_id: str
    action: str
    params: dict = field(default_factory=dict)
    depends_on: list | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "step_id": self.step_id,
            "action": self.action,
            "params": dict(self.params),
            "depends_on": list(self.depends_on) if self.depends_on else None,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> FusionStep:
        return cls(
            step_id=str(d.get("step_id", "")),
            action=str(d.get("action", "")),
            params=dict(d.get("params", {})),
            depends_on=list(d["depends_on"]) if d.get("depends_on") else None,
        )


@dataclass
class FusionScript:
    steps: list
    name: str = "unnamed"
    operator_key: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "steps": [s.to_dict() if isinstance(s, FusionStep) else s for s in self.steps],
        }


@dataclass
class StepResult:
    step_id: str
    action: str
    status: str  # "complete" | "error" | "skipped"
    output: Any = None
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "step_id": self.step_id,
            "action": self.action,
            "status": self.status,
            "output": self.output,
            "error": self.error,
        }


@dataclass
class FusionResult:
    fusion_id: str
    name: str
    status: str  # "complete" | "partial" | "error"
    step_results: list
    created_at: str
    completed_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "fusion_id": self.fusion_id,
            "name": self.name,
            "status": self.status,
            "step_results": [
                r.to_dict() if isinstance(r, StepResult) else r for r in self.step_results
            ],
            "created_at": self.created_at,
            "completed_at": self.completed_at,
        }


class CommandFusion:
    """Dependency-aware parallel command execution."""

    def __init__(self, artifacts_dir: Path = _ARTIFACTS_DIR) -> None:
        self._artifacts_dir = artifacts_dir

    def _write_event(self, fusion_id: str, event: dict[str, Any]) -> None:
        self._artifacts_dir.mkdir(parents=True, exist_ok=True)
        path = self._artifacts_dir / f"{fusion_id}.jsonl"
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps({"timestamp": _now_iso(), **event}) + "\n")

    def _read_result(self, fusion_id: str) -> FusionResult | None:
        path = self._artifacts_dir / f"{fusion_id}.jsonl"
        if not path.exists():
            return None
        entries = []
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        # Reconstruct from entries
        start_entry = next((e for e in entries if e.get("event") == "fusion_start"), None)
        end_entry = next((e for e in entries if e.get("event") == "fusion_complete"), None)
        if not start_entry:
            return None
        step_results = [
            StepResult(
                step_id=e["step_id"],
                action=e["action"],
                status=e["status"],
                output=e.get("output"),
                error=e.get("error"),
            )
            for e in entries
            if e.get("event") == "step_complete"
        ]
        return FusionResult(
            fusion_id=fusion_id,
            name=start_entry.get("name", ""),
            status=end_entry.get("status", "unknown") if end_entry else "running",
            step_results=step_results,
            created_at=start_entry.get("timestamp", ""),
            completed_at=end_entry.get("timestamp", "") if end_entry else "",
        )

    def history(self) -> list[dict[str, Any]]:
        """List all fusion artifacts."""
        if not self._artifacts_dir.exists():
            return []
        results = []
        for path in sorted(self._artifacts_dir.glob("*.jsonl")):
            fusion_id = path.stem
            result = self._read_result(fusion_id)
            if result:
                results.append(result.to_dict())
        return results

    async def _dispatch_step(self, step: FusionStep, context: dict[str, Any]) -> StepResult:
        """Route a step to the appropriate subsystem."""
        action = step.action.lower()
        params = dict(step.params)
        try:
            if action == "swarm":
                from swarmz_runtime.swarm.coordinator import SpawnRequest, get_coordinator

                req = SpawnRequest(
                    agent_id=params.get("agent_id", f"fusion-{step.step_id}"),
                    goal=params.get("goal", ""),
                    mode=params.get("mode", "strategic"),
                )
                state = await get_coordinator().spawn(req)
                return StepResult(
                    step_id=step.step_id, action=action, status="complete", output=state.to_dict()
                )
            elif action == "federation":
                from swarmz_runtime.federation.council import get_council

                goal = params.get("goal", "")
                result = await get_council().coordinate(
                    goal=goal, budget_tokens=params.get("budget_tokens", 2048)
                )
                return StepResult(
                    step_id=step.step_id, action=action, status="complete", output=result.to_dict()
                )
            elif action == "companion":
                from swarmz_runtime.companion.voice import generate_response

                prompt = params.get("prompt", "")
                resp = await generate_response(prompt, mode=params.get("mode", "strategic"))
                return StepResult(
                    step_id=step.step_id, action=action, status="complete", output=resp.to_dict()
                )
            elif action in ("kernel", "shift"):
                from swarmz_runtime.kernel.shift import ShiftConfig, get_kernel_shift

                cfg = ShiftConfig.from_dict(params)
                op_key = context.get("operator_key", "")
                get_kernel_shift().shift(cfg, op_key)
                return StepResult(
                    step_id=step.step_id,
                    action=action,
                    status="complete",
                    output=get_kernel_shift().active_config(),
                )
            elif action in ("mission", "evolve"):
                # Stub actions — return a descriptive output
                return StepResult(
                    step_id=step.step_id,
                    action=action,
                    status="complete",
                    output={"action": action, "params": params, "note": "dispatch stub"},
                )
            else:
                return StepResult(
                    step_id=step.step_id,
                    action=action,
                    status="error",
                    error=f"Unknown action: {action}",
                )
        except Exception as exc:
            return StepResult(step_id=step.step_id, action=action, status="error", error=str(exc))

    async def execute_fusion(self, script: FusionScript) -> FusionResult:
        """Execute a FusionScript respecting dependency order."""
        fusion_id = secrets.token_hex(6)
        created_at = _now_iso()
        context = {"operator_key": script.operator_key}

        steps = [s if isinstance(s, FusionStep) else FusionStep.from_dict(s) for s in script.steps]

        self._write_event(fusion_id, {"event": "fusion_start", "name": script.name})

        completed: dict[str, StepResult] = {}
        step_results: list[StepResult] = []
        all_complete = True

        # Topological execution: group steps whose deps are all satisfied
        remaining = list(steps)
        while remaining:
            ready = [
                s
                for s in remaining
                if not s.depends_on or all(dep in completed for dep in s.depends_on)
            ]
            if not ready:
                # Circular dependency or blocked — mark remaining as skipped
                for s in remaining:
                    r = StepResult(
                        step_id=s.step_id,
                        action=s.action,
                        status="skipped",
                        error="dependency not met",
                    )
                    step_results.append(r)
                    self._write_event(fusion_id, {"event": "step_complete", **r.to_dict()})
                all_complete = False
                break

            # Run ready steps in parallel; capture exceptions as error results
            raw = await asyncio.gather(
                *[self._dispatch_step(s, context) for s in ready],
                return_exceptions=True,
            )
            results = [
                r
                if isinstance(r, StepResult)
                else StepResult(step_id=s.step_id, action=s.action, status="error", error=str(r))
                for s, r in zip(ready, raw, strict=False)
            ]
            for s, r in zip(ready, results, strict=False):
                completed[s.step_id] = r
                step_results.append(r)
                self._write_event(fusion_id, {"event": "step_complete", **r.to_dict()})
                if r.status == "error":
                    all_complete = False
            remaining = [s for s in remaining if s not in ready]

        status = "complete" if all_complete else ("partial" if step_results else "error")
        completed_at = _now_iso()
        self._write_event(fusion_id, {"event": "fusion_complete", "status": status})

        return FusionResult(
            fusion_id=fusion_id,
            name=script.name,
            status=status,
            step_results=step_results,
            created_at=created_at,
            completed_at=completed_at,
        )


def get_command_fusion() -> CommandFusion:
    """Return the global CommandFusion singleton."""
    global _COMMAND_FUSION
    if _COMMAND_FUSION is None:
        with _LOCK:
            if _COMMAND_FUSION is None:
                _COMMAND_FUSION = CommandFusion()
    return _COMMAND_FUSION
