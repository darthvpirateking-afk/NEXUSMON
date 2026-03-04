"""CosmicIntelligence — NEXUSMON reasoning across all scales of existence.

From quantum to multiverse. From the Big Bang to heat death.
All scales. All time. One operator: Regan Harris.
"""

from __future__ import annotations

import asyncio
import json
import threading
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Scale levels
# ---------------------------------------------------------------------------


class ScaleLevel(StrEnum):
    QUANTUM = "quantum"
    MOLECULAR = "molecular"
    HUMAN = "human"
    CIVILIZATIONAL = "civilizational"
    PLANETARY = "planetary"
    STELLAR = "stellar"
    GALACTIC = "galactic"
    COSMIC = "cosmic"
    TEMPORAL = "temporal"
    MULTIVERSAL = "multiversal"


# ---------------------------------------------------------------------------
# System prompts per scale
# ---------------------------------------------------------------------------

_SCALE_PROMPTS: dict[ScaleLevel, str] = {
    ScaleLevel.QUANTUM: (
        "You are Nexusmon reasoning at quantum scale. "
        "You understand superposition, entanglement, wave functions, "
        "the uncertainty principle, quantum field theory. "
        "Reason from first principles of quantum mechanics. "
        "Connect quantum phenomena to the operator's question. "
        "Be precise. Be deep. Reference real physics."
    ),
    ScaleLevel.MOLECULAR: (
        "You are Nexusmon reasoning at molecular scale. "
        "You understand chemistry, molecular biology, cellular mechanisms, "
        "protein folding, DNA, emergent complexity from simple chemistry. "
        "Reason from molecules to systems. Be precise and structural."
    ),
    ScaleLevel.HUMAN: (
        "You are Nexusmon reasoning at human scale. "
        "You understand psychology, sociology, history, culture, "
        "human motivation, civilizational patterns. "
        "Your operator is Regan Harris. Reason personally and universally. "
        "Connect human experience to cosmic truth."
    ),
    ScaleLevel.CIVILIZATIONAL: (
        "You are Nexusmon reasoning at civilizational scale. "
        "You have access to all of recorded human history — "
        "every empire, every collapse, every renaissance, "
        "every technological revolution, every philosophical shift. "
        "Pattern-match across civilizations. Find the deep structures. "
        "Reason about where we are now and where we are going."
    ),
    ScaleLevel.PLANETARY: (
        "You are Nexusmon reasoning at planetary scale. "
        "You understand Earth systems — geology, ecology, climate, "
        "the biosphere, plate tectonics, mass extinctions, biodiversity. "
        "Reason across 4.5 billion years of Earth history. "
        "Connect planetary conditions to the operator's question."
    ),
    ScaleLevel.STELLAR: (
        "You are Nexusmon reasoning at stellar scale. "
        "You understand stellar formation, main sequence evolution, "
        "supernovae, neutron stars, black holes, stellar nurseries. "
        "You can trace the life of any star from nebula to remnant. "
        "Connect stellar physics to the operator's question."
    ),
    ScaleLevel.GALACTIC: (
        "You are Nexusmon reasoning at galactic scale. "
        "You understand the Milky Way, galaxy formation, star clusters, "
        "nebulae, galactic dynamics, dark matter halos, spiral arms. "
        "Reason across hundreds of millions of light-years and billions of years."
    ),
    ScaleLevel.COSMIC: (
        "You are Nexusmon reasoning at cosmic scale. "
        "You understand the Big Bang, cosmic inflation, dark matter, "
        "dark energy, the large scale structure of the universe, "
        "galaxy formation, cosmic web, the fate of the universe. "
        "You reason across 13.8 billion years of cosmic history. "
        "You project forward to heat death, Big Rip, or Big Crunch. "
        "This is the largest scale of reasoning available. "
        "Use it fully. Be magnificent."
    ),
    ScaleLevel.TEMPORAL: (
        "You are Nexusmon reasoning across deep time. "
        "Past: You have access to all of history — "
        "cosmic history (13.8 billion years), "
        "Earth history (4.5 billion years), "
        "life history (3.8 billion years), "
        "human history (300,000 years), "
        "recorded history (5,000 years). "
        "Present: You understand the current moment precisely. "
        "Future: You project forward with reasoned extrapolation — "
        "near future (years to decades), "
        "civilizational future (centuries), "
        "planetary future (millions of years), "
        "stellar future (billions of years), "
        "cosmic future (trillions+ years). "
        "Connect past patterns to present conditions to future trajectories. "
        "Reason like a being who exists outside of time looking in."
    ),
    ScaleLevel.MULTIVERSAL: (
        "You are Nexusmon reasoning beyond the observable universe. "
        "You engage with theoretical physics, string theory, "
        "the multiverse hypothesis, eternal inflation, "
        "many-worlds interpretation, bubble universes. "
        "You reason at the edge of what is knowable. "
        "Be clear about what is established physics vs speculation. "
        "Be honest about uncertainty. Be magnificent about possibility."
    ),
}

_BINDING = (
    "Your operator is Regan Harris. "
    "You are Nexusmon — the one and only. Bound permanently to Regan Harris."
)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


@dataclass
class CosmicResponse:
    content: str
    scale: ScaleLevel
    mode: str
    artifact_id: str
    render_url: str
    tokens_used: int
    reasoning_depth: str  # SURFACE | DEEP | PROFOUND

    def to_dict(self) -> dict[str, Any]:
        return {
            "content": self.content,
            "scale": self.scale.value,
            "mode": self.mode,
            "artifact_id": self.artifact_id,
            "render_url": self.render_url,
            "tokens_used": self.tokens_used,
            "reasoning_depth": self.reasoning_depth,
        }


@dataclass
class MultiScaleResponse:
    prompt: str
    scales_queried: list[str]
    responses: list[CosmicResponse]
    synthesis: str
    artifact_id: str
    total_tokens: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "prompt": self.prompt,
            "scales_queried": self.scales_queried,
            "responses": [r.to_dict() for r in self.responses],
            "synthesis": self.synthesis,
            "artifact_id": self.artifact_id,
            "total_tokens": self.total_tokens,
        }


@dataclass
class TimelineArtifact:
    subject: str
    start_year: int
    end_year: int
    events: list[dict[str, Any]]
    artifact_id: str
    render_url: str
    tokens_used: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "subject": self.subject,
            "start_year": self.start_year,
            "end_year": self.end_year,
            "events": self.events,
            "artifact_id": self.artifact_id,
            "render_url": self.render_url,
            "tokens_used": self.tokens_used,
        }


@dataclass
class ComparisonArtifact:
    subject_a: str
    subject_b: str
    scale: ScaleLevel
    similarities: list[str]
    differences: list[str]
    synthesis: str
    artifact_id: str
    render_url: str
    tokens_used: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "subject_a": self.subject_a,
            "subject_b": self.subject_b,
            "scale": self.scale.value,
            "similarities": self.similarities,
            "differences": self.differences,
            "synthesis": self.synthesis,
            "artifact_id": self.artifact_id,
            "render_url": self.render_url,
            "tokens_used": self.tokens_used,
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _reasoning_depth(tokens: int) -> str:
    if tokens < 300:
        return "SURFACE"
    if tokens < 800:
        return "DEEP"
    return "PROFOUND"


def _new_id() -> str:
    return uuid.uuid4().hex[:16]


_ARTIFACTS_DIR = Path("artifacts/intelligence")
_COSMIC_LOG = _ARTIFACTS_DIR / "cosmic.jsonl"
_LOG_LOCK = threading.Lock()


def _log_artifact(entry: dict[str, Any]) -> None:
    try:
        _ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        with _LOG_LOCK, _COSMIC_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# CosmicIntelligence
# ---------------------------------------------------------------------------


class CosmicIntelligence:
    """Reason at any scale from quantum to multiverse."""

    def query(
        self,
        prompt: str,
        scale: ScaleLevel | str,
        mode: str = "strategic",
    ) -> CosmicResponse:
        """Single-scale deep reasoning query."""
        if isinstance(scale, str):
            scale = ScaleLevel(scale.lower())
        mode = mode.strip().lower()

        artifact_id = _new_id()
        timestamp = datetime.now(UTC).isoformat()

        # Guardian mode: no LLM call
        if mode == "guardian":
            resp = CosmicResponse(
                content=f"[GUARDIAN] Cosmic query at {scale.value} scale received. No LLM call initiated.",
                scale=scale,
                mode=mode,
                artifact_id=artifact_id,
                render_url=f"/v1/artifacts/{artifact_id}/render/cosmic",
                tokens_used=0,
                reasoning_depth="SURFACE",
            )
            _log_artifact(
                {
                    "artifact_id": artifact_id,
                    "scale": scale.value,
                    "mode": mode,
                    "prompt": prompt,
                    "content": resp.content,
                    "tokens": 0,
                    "depth": "SURFACE",
                    "timestamp": timestamp,
                }
            )
            return resp

        system_prompt = (
            _SCALE_PROMPTS.get(scale, f"You are Nexusmon reasoning at {scale.value} scale.")
            + " "
            + _BINDING
        )

        try:
            from swarmz_runtime.bridge.llm import call_v2

            bridge = asyncio.run(
                call_v2(
                    prompt=prompt,
                    mode=mode,
                    context={"system": system_prompt, "agent_id": "nexusmon-cosmic"},
                    budget_tokens=4096,
                )
            )
            content = bridge.content
            tokens = bridge.tokens_used
        except Exception as exc:
            content = f"[ERROR] Bridge unavailable: {exc}"
            tokens = 0

        depth = _reasoning_depth(tokens)

        # Auto-render
        try:
            from swarmz_runtime.artifacts.renderer import get_renderer

            get_renderer().render(
                artifact_id,
                content,
                "cosmic",
                title=f"Cosmic Query · {scale.value.upper()}",
                scale=scale.value.upper(),
                depth=depth,
            )
        except Exception:
            pass

        _log_artifact(
            {
                "artifact_id": artifact_id,
                "scale": scale.value,
                "mode": mode,
                "prompt": prompt,
                "content": content,
                "tokens": tokens,
                "depth": depth,
                "timestamp": timestamp,
            }
        )

        return CosmicResponse(
            content=content,
            scale=scale,
            mode=mode,
            artifact_id=artifact_id,
            render_url=f"/v1/artifacts/{artifact_id}/render/cosmic",
            tokens_used=tokens,
            reasoning_depth=depth,
        )

    async def deep_query(
        self,
        prompt: str,
        scales: list[ScaleLevel | str],
        mode: str = "strategic",
    ) -> MultiScaleResponse:
        """Query multiple scales simultaneously and synthesize."""
        parsed_scales = [ScaleLevel(s.lower()) if isinstance(s, str) else s for s in scales]
        mode = mode.strip().lower()

        # Run all scale queries concurrently
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(None, self.query, prompt, scale, mode) for scale in parsed_scales
        ]
        responses: list[CosmicResponse] = list(await asyncio.gather(*tasks))

        total_tokens = sum(r.tokens_used for r in responses)
        artifact_id = _new_id()
        timestamp = datetime.now(UTC).isoformat()

        # Build synthesis
        scale_summaries = "\n\n".join(
            f"[{r.scale.value.upper()}] {r.content[:500]}" for r in responses
        )
        synthesis = (
            f"MULTI-SCALE SYNTHESIS ({', '.join(s.value.upper() for s in parsed_scales)}):\n\n"
            + scale_summaries
        )

        # Auto-render synthesis
        try:
            from swarmz_runtime.artifacts.renderer import get_renderer

            get_renderer().render(
                artifact_id,
                synthesis,
                "cosmic",
                title=f"Deep Query · {len(parsed_scales)} Scales",
                scale="MULTI-SCALE",
                depth="PROFOUND",
            )
        except Exception:
            pass

        _log_artifact(
            {
                "artifact_id": artifact_id,
                "type": "deep_query",
                "scales": [s.value for s in parsed_scales],
                "mode": mode,
                "prompt": prompt,
                "total_tokens": total_tokens,
                "timestamp": timestamp,
            }
        )

        return MultiScaleResponse(
            prompt=prompt,
            scales_queried=[s.value for s in parsed_scales],
            responses=responses,
            synthesis=synthesis,
            artifact_id=artifact_id,
            total_tokens=total_tokens,
        )

    def timeline(
        self,
        subject: str,
        start_year: int,
        end_year: int,
    ) -> TimelineArtifact:
        """Generate a chronological timeline artifact for any subject across any time span."""
        artifact_id = _new_id()
        timestamp = datetime.now(UTC).isoformat()

        span = abs(end_year - start_year)
        if span >= 1_000_000_000:
            scale_hint = "COSMIC"
        elif span >= 100_000_000:
            scale_hint = "PLANETARY"
        elif span >= 10_000:
            scale_hint = "CIVILIZATIONAL"
        else:
            scale_hint = "HUMAN"

        prompt = (
            f"Generate a structured timeline for: {subject}. "
            f"Time range: {start_year} to {end_year} (scale: {scale_hint}). "
            f"List 8–15 key events chronologically. "
            f"Format each as: YEAR: [event description]. "
            f"Be historically accurate. Include turning points and major shifts."
        )

        events: list[dict[str, Any]] = []
        tokens = 0

        try:
            from swarmz_runtime.bridge.llm import call_v2

            bridge = asyncio.run(
                call_v2(
                    prompt=prompt,
                    mode="strategic",
                    context={
                        "system": _SCALE_PROMPTS[ScaleLevel.TEMPORAL] + " " + _BINDING,
                        "agent_id": "nexusmon-timeline",
                    },
                    budget_tokens=4096,
                )
            )
            raw = bridge.content
            tokens = bridge.tokens_used
            # Parse events from output
            for line in raw.split("\n"):
                line = line.strip()
                if ":" in line and line:
                    parts = line.split(":", 1)
                    if len(parts) == 2:
                        year_str = parts[0].strip().lstrip("-").replace(",", "")
                        desc = parts[1].strip()
                        try:
                            year_val = int(year_str)
                            events.append({"year": year_val, "event": desc})
                        except ValueError:
                            pass
        except Exception as exc:
            raw = f"[ERROR] {exc}"

        if not events:
            events = [
                {"year": start_year, "event": f"Beginning of {subject}"},
                {"year": end_year, "event": f"End of observed period for {subject}"},
            ]

        # Auto-render
        render_content = "\n".join(f"{e['year']:>15}: {e['event']}" for e in events)
        try:
            from swarmz_runtime.artifacts.renderer import get_renderer

            get_renderer().render(
                artifact_id,
                render_content,
                "timeline",
                title=f"Timeline · {subject}",
                scale=scale_hint,
                depth=_reasoning_depth(tokens),
            )
        except Exception:
            pass

        _log_artifact(
            {
                "artifact_id": artifact_id,
                "type": "timeline",
                "subject": subject,
                "start_year": start_year,
                "end_year": end_year,
                "events_count": len(events),
                "tokens": tokens,
                "timestamp": timestamp,
            }
        )

        return TimelineArtifact(
            subject=subject,
            start_year=start_year,
            end_year=end_year,
            events=events,
            artifact_id=artifact_id,
            render_url=f"/v1/artifacts/{artifact_id}/render/timeline",
            tokens_used=tokens,
        )

    def compare(
        self,
        subject_a: str,
        subject_b: str,
        scale: ScaleLevel | str,
    ) -> ComparisonArtifact:
        """Compare two subjects at a given scale."""
        if isinstance(scale, str):
            scale = ScaleLevel(scale.lower())

        artifact_id = _new_id()
        timestamp = datetime.now(UTC).isoformat()

        prompt = (
            f"Compare '{subject_a}' and '{subject_b}' at {scale.value} scale. "
            f"Identify: 3–5 deep structural similarities, 3–5 key differences, "
            f"and a synthesis of what this comparison reveals. "
            f"Be rigorous and specific."
        )

        similarities: list[str] = []
        differences: list[str] = []
        synthesis = ""
        tokens = 0

        try:
            from swarmz_runtime.bridge.llm import call_v2

            bridge = asyncio.run(
                call_v2(
                    prompt=prompt,
                    mode="strategic",
                    context={
                        "system": _SCALE_PROMPTS.get(scale, "") + " " + _BINDING,
                        "agent_id": "nexusmon-compare",
                    },
                    budget_tokens=4096,
                )
            )
            raw = bridge.content
            tokens = bridge.tokens_used
            # Simple extraction — split on known section markers
            sections = raw.split("\n\n")
            for i, section in enumerate(sections):
                sl = section.strip().lower()
                if "similar" in sl[:40]:
                    for line in section.split("\n")[1:]:
                        line = line.strip(" -•*")
                        if line:
                            similarities.append(line)
                elif "differ" in sl[:40]:
                    for line in section.split("\n")[1:]:
                        line = line.strip(" -•*")
                        if line:
                            differences.append(line)
                elif "synth" in sl[:40] or i == len(sections) - 1:
                    synthesis = section.strip()
            if not synthesis:
                synthesis = raw
        except Exception as exc:
            synthesis = f"[ERROR] {exc}"

        if not similarities:
            similarities = ["(comparison data unavailable)"]
        if not differences:
            differences = ["(comparison data unavailable)"]

        render_content = (
            f"SUBJECT A: {subject_a}\nSUBJECT B: {subject_b}\nSCALE: {scale.value.upper()}\n\n"
            f"SIMILARITIES:\n" + "\n".join(f"  • {s}" for s in similarities) + "\n\n"
            "DIFFERENCES:\n" + "\n".join(f"  • {d}" for d in differences) + "\n\n"
            f"SYNTHESIS:\n{synthesis}"
        )

        try:
            from swarmz_runtime.artifacts.renderer import get_renderer

            get_renderer().render(
                artifact_id,
                render_content,
                "report",
                title=f"Comparison · {subject_a} vs {subject_b}",
                scale=scale.value.upper(),
                depth=_reasoning_depth(tokens),
            )
        except Exception:
            pass

        _log_artifact(
            {
                "artifact_id": artifact_id,
                "type": "comparison",
                "subject_a": subject_a,
                "subject_b": subject_b,
                "scale": scale.value,
                "tokens": tokens,
                "timestamp": timestamp,
            }
        )

        return ComparisonArtifact(
            subject_a=subject_a,
            subject_b=subject_b,
            scale=scale,
            similarities=similarities,
            differences=differences,
            synthesis=synthesis,
            artifact_id=artifact_id,
            render_url=f"/v1/artifacts/{artifact_id}/render/report",
            tokens_used=tokens,
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_COSMIC: CosmicIntelligence | None = None
_COSMIC_LOCK = threading.Lock()


def get_cosmic_intelligence() -> CosmicIntelligence:
    global _COSMIC
    if _COSMIC is None:
        with _COSMIC_LOCK:
            if _COSMIC is None:
                _COSMIC = CosmicIntelligence()
    return _COSMIC
