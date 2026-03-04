"""Tests for ArtifactRenderer — Task 1 of v2.1.0 build."""
from __future__ import annotations

import uuid
from pathlib import Path

import pytest

from swarmz_runtime.artifacts.renderer import ArtifactRenderer, RenderResult, get_renderer


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def renderer(tmp_path: Path) -> ArtifactRenderer:
    """ArtifactRenderer pointed at a temp directory."""
    return ArtifactRenderer(
        artifacts_dir=tmp_path / "rendered",
        templates_dir=tmp_path / "templates",
    )


def _aid() -> str:
    return uuid.uuid4().hex[:12]


# ---------------------------------------------------------------------------
# RenderResult
# ---------------------------------------------------------------------------

def test_render_result_to_dict():
    rr = RenderResult(
        artifact_id="abc123",
        format="cosmic",
        output_path="/tmp/abc123_cosmic.html",
        render_url="/v1/artifacts/abc123/render/cosmic",
        rendered_at="2026-01-01T00:00:00+00:00",
        size_bytes=512,
    )
    d = rr.to_dict()
    assert d["artifact_id"] == "abc123"
    assert d["format"] == "cosmic"
    assert d["size_bytes"] == 512


# ---------------------------------------------------------------------------
# ArtifactRenderer.render()
# ---------------------------------------------------------------------------

def test_render_creates_html_file(renderer: ArtifactRenderer, tmp_path: Path):
    aid = _aid()
    result = renderer.render(aid, "test content", "html")
    assert Path(result.output_path).exists()
    assert result.format == "html"
    assert result.artifact_id == aid
    assert result.size_bytes > 0


def test_render_content_appears_in_output(renderer: ArtifactRenderer):
    aid = _aid()
    result = renderer.render(aid, "HELLO NEXUSMON", "report", title="My Report")
    html = Path(result.output_path).read_text(encoding="utf-8")
    assert "HELLO NEXUSMON" in html


def test_render_title_appears_in_output(renderer: ArtifactRenderer):
    aid = _aid()
    result = renderer.render(aid, "content", "doctrine", title="DOCTRINE BLOCK")
    html = Path(result.output_path).read_text(encoding="utf-8")
    assert "DOCTRINE BLOCK" in html


def test_render_scale_appears_in_output(renderer: ArtifactRenderer):
    aid = _aid()
    result = renderer.render(aid, "content", "cosmic", scale="GALACTIC")
    html = Path(result.output_path).read_text(encoding="utf-8")
    assert "GALACTIC" in html


def test_render_depth_appears_in_output(renderer: ArtifactRenderer):
    aid = _aid()
    result = renderer.render(aid, "content", "cosmic", depth="PROFOUND")
    html = Path(result.output_path).read_text(encoding="utf-8")
    assert "PROFOUND" in html


def test_render_operator_appears_in_output(renderer: ArtifactRenderer):
    aid = _aid()
    result = renderer.render(aid, "content", "html", operator="Regan Harris")
    html = Path(result.output_path).read_text(encoding="utf-8")
    assert "Regan Harris" in html


def test_render_url_format(renderer: ArtifactRenderer):
    aid = _aid()
    result = renderer.render(aid, "x", "report")
    assert result.render_url == f"/v1/artifacts/{aid}/render/report"


def test_render_all_formats_succeed(renderer: ArtifactRenderer):
    for fmt in ArtifactRenderer.FORMATS:
        aid = _aid()
        result = renderer.render(aid, f"content for {fmt}", fmt)
        assert Path(result.output_path).exists(), f"Format {fmt} failed"


def test_render_invalid_format_raises(renderer: ArtifactRenderer):
    with pytest.raises(ValueError, match="Unsupported format"):
        renderer.render(_aid(), "content", "invalid_format_xyz")


def test_render_additive_never_overwrites(renderer: ArtifactRenderer):
    """Rendering same artifact_id + format twice produces two distinct files."""
    aid = _aid()
    r1 = renderer.render(aid, "first", "html")
    r2 = renderer.render(aid, "second", "html")
    assert r1.output_path != r2.output_path
    assert Path(r1.output_path).exists()
    assert Path(r2.output_path).exists()
    # Both have distinct content
    h1 = Path(r1.output_path).read_text()
    h2 = Path(r2.output_path).read_text()
    assert "first" in h1
    assert "second" in h2


# ---------------------------------------------------------------------------
# ArtifactRenderer.list_renders()
# ---------------------------------------------------------------------------

def test_list_renders_empty_before_any_render(renderer: ArtifactRenderer):
    results = renderer.list_renders("nonexistent_id")
    assert results == []


def test_list_renders_returns_rendered_files(renderer: ArtifactRenderer):
    aid = _aid()
    renderer.render(aid, "a", "html")
    renderer.render(aid, "b", "cosmic")
    renders = renderer.list_renders(aid)
    formats = {r.format for r in renders}
    assert "html" in formats
    assert "cosmic" in formats


def test_list_renders_does_not_include_other_artifacts(renderer: ArtifactRenderer):
    aid1 = _aid()
    aid2 = _aid()
    renderer.render(aid1, "one", "html")
    renderer.render(aid2, "two", "html")
    renders = renderer.list_renders(aid1)
    for r in renders:
        assert r.artifact_id == aid1


# ---------------------------------------------------------------------------
# ArtifactRenderer.render_direct()
# ---------------------------------------------------------------------------

def test_render_direct_generates_artifact_id(renderer: ArtifactRenderer):
    result = renderer.render_direct("some content", "html")
    assert len(result.artifact_id) == 12
    assert Path(result.output_path).exists()


def test_render_direct_custom_title(renderer: ArtifactRenderer):
    result = renderer.render_direct("content", "report", title="DIRECT TITLE")
    html = Path(result.output_path).read_text()
    assert "DIRECT TITLE" in html


# ---------------------------------------------------------------------------
# Template loading
# ---------------------------------------------------------------------------

def test_custom_template_is_used(renderer: ArtifactRenderer, tmp_path: Path):
    """If a template file exists for a format, it should be used."""
    (tmp_path / "templates").mkdir(parents=True, exist_ok=True)
    (tmp_path / "templates" / "chart.html").write_text(
        "CUSTOM:{{TITLE}}:{{CONTENT}}", encoding="utf-8"
    )
    aid = _aid()
    result = renderer.render(aid, "MYDATA", "chart", title="MYCHART")
    html = Path(result.output_path).read_text()
    assert "CUSTOM:MYCHART:MYDATA" in html


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

def test_get_renderer_returns_same_instance():
    r1 = get_renderer()
    r2 = get_renderer()
    assert r1 is r2
