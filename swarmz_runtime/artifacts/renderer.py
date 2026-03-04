"""ArtifactRenderer — visual output engine for NEXUSMON artifacts.

Renders any artifact content into styled HTML using format-specific templates.
All renders are additive — never overwritten. Stored at artifacts/rendered/.
"""
from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class RenderResult:
    artifact_id: str
    format: str
    output_path: str
    render_url: str
    rendered_at: str
    size_bytes: int

    def to_dict(self) -> dict:
        return {
            "artifact_id": self.artifact_id,
            "format": self.format,
            "output_path": self.output_path,
            "render_url": self.render_url,
            "rendered_at": self.rendered_at,
            "size_bytes": self.size_bytes,
        }


# ---------------------------------------------------------------------------
# Default HTML template (used when no template file exists for a format)
# ---------------------------------------------------------------------------

_DEFAULT_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{TITLE}}</title>
<style>
  body { background: #0D1117; color: #F0F6FC; font-family: Consolas, 'Courier New', monospace;
         padding: 32px; max-width: 900px; margin: 0 auto; }
  h2 { color: #00B4D8; margin-bottom: 16px; }
  .scale-badge { background: #00B4D8; color: #0D1117; padding: 2px 12px;
                 border-radius: 4px; font-size: 0.82rem; font-weight: 700; }
  .depth-badge { background: #8957E5; color: #F0F6FC; padding: 2px 12px;
                 border-radius: 4px; font-size: 0.82rem; margin-left: 8px; }
  .format-badge { background: #FFD700; color: #0D1117; padding: 2px 12px;
                  border-radius: 4px; font-size: 0.82rem; margin-left: 8px; }
  .content { margin: 28px 0; line-height: 1.8; white-space: pre-wrap; font-size: 0.93rem; }
  .meta { color: #8B949E; font-size: 0.78rem; margin-top: 32px;
          border-top: 1px solid #21262D; padding-top: 14px; }
  footer { color: #30363D; font-size: 0.72rem; margin-top: 16px; text-align: center; }
  hr { border: none; border-top: 1px solid #21262D; margin: 20px 0; }
</style>
</head>
<body>
<h2>{{TITLE}}</h2>
<span class="scale-badge">{{SCALE}}</span>
<span class="depth-badge">{{DEPTH}}</span>
<span class="format-badge">{{FORMAT}}</span>
<hr>
<div class="content">{{CONTENT}}</div>
<div class="meta">
  <div>Operator: <strong>{{OPERATOR}}</strong></div>
  <div>Artifact ID: {{ARTIFACT_ID}}</div>
  <div>Rendered: {{TIMESTAMP}}</div>
</div>
<footer>◈ NEXUSMON &middot; ARTIFACT INTELLIGENCE ENGINE &middot; v2.1.0</footer>
</body>
</html>"""


# ---------------------------------------------------------------------------
# ArtifactRenderer
# ---------------------------------------------------------------------------

class ArtifactRenderer:
    FORMATS = ["html", "report", "timeline", "chart", "doctrine", "cosmic"]

    def __init__(
        self,
        artifacts_dir: Path | None = None,
        templates_dir: Path | None = None,
    ) -> None:
        self._artifacts_dir = artifacts_dir or Path("artifacts/rendered")
        self._templates_dir = templates_dir or Path("swarmz_runtime/artifacts/templates")
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_dirs(self) -> None:
        self._artifacts_dir.mkdir(parents=True, exist_ok=True)
        self._templates_dir.mkdir(parents=True, exist_ok=True)

    def _load_template(self, format: str) -> str:
        template_file = self._templates_dir / f"{format}.html"
        if template_file.exists():
            return template_file.read_text(encoding="utf-8")
        return _DEFAULT_TEMPLATE

    @staticmethod
    def _apply_template(template: str, subs: dict[str, str]) -> str:
        result = template
        for key, value in subs.items():
            result = result.replace("{{" + key + "}}", value)
        return result

    def _output_path(self, artifact_id: str, format: str) -> Path:
        """Return output path, appending timestamp suffix if file already exists (additive)."""
        base = self._artifacts_dir / f"{artifact_id}_{format}.html"
        if not base.exists():
            return base
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        return self._artifacts_dir / f"{artifact_id}_{format}_{ts}.html"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def render(
        self,
        artifact_id: str,
        content: str,
        format: str,
        title: str = "NEXUSMON Artifact",
        scale: str = "—",
        depth: str = "—",
        operator: str = "Regan Harris",
    ) -> RenderResult:
        """Render artifact content to HTML using format-specific template."""
        if format not in self.FORMATS:
            raise ValueError(f"Unsupported format '{format}'. Choose from: {self.FORMATS}")

        self._ensure_dirs()
        template = self._load_template(format)
        timestamp = datetime.now(timezone.utc).isoformat()

        html = self._apply_template(template, {
            "TITLE": title,
            "CONTENT": content,
            "SCALE": scale,
            "DEPTH": depth,
            "FORMAT": format.upper(),
            "TIMESTAMP": timestamp,
            "OPERATOR": operator,
            "ARTIFACT_ID": artifact_id,
        })

        with self._lock:
            out_path = self._output_path(artifact_id, format)
            out_path.write_text(html, encoding="utf-8")

        return RenderResult(
            artifact_id=artifact_id,
            format=format,
            output_path=str(out_path),
            render_url=f"/v1/artifacts/{artifact_id}/render/{format}",
            rendered_at=timestamp,
            size_bytes=out_path.stat().st_size,
        )

    def list_renders(self, artifact_id: str) -> list[RenderResult]:
        """List all rendered outputs for a given artifact_id."""
        if not self._artifacts_dir.exists():
            return []
        results: list[RenderResult] = []
        for p in sorted(self._artifacts_dir.glob(f"{artifact_id}_*.html")):
            stem = p.stem  # e.g. "abc123_cosmic" or "abc123_cosmic_20260101T..."
            tail = stem[len(artifact_id) + 1:]  # strip "artifact_id_"
            fmt_candidate = tail.split("_")[0]
            results.append(RenderResult(
                artifact_id=artifact_id,
                format=fmt_candidate,
                output_path=str(p),
                render_url=f"/v1/artifacts/{artifact_id}/render/{fmt_candidate}",
                rendered_at=datetime.fromtimestamp(
                    p.stat().st_mtime, tz=timezone.utc
                ).isoformat(),
                size_bytes=p.stat().st_size,
            ))
        return results

    def render_direct(
        self,
        content: str,
        format: str,
        title: str = "NEXUSMON Direct Render",
        scale: str = "—",
        depth: str = "—",
        operator: str = "Regan Harris",
    ) -> RenderResult:
        """Render content without a pre-existing artifact_id (generates one)."""
        artifact_id = uuid.uuid4().hex[:12]
        return self.render(artifact_id, content, format, title, scale, depth, operator)


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_RENDERER: ArtifactRenderer | None = None
_RENDERER_LOCK = threading.Lock()


def get_renderer() -> ArtifactRenderer:
    global _RENDERER
    if _RENDERER is None:
        with _RENDERER_LOCK:
            if _RENDERER is None:
                _RENDERER = ArtifactRenderer()
    return _RENDERER
