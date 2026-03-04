"""Tests for CosmicIntelligence — Task 2 of v2.1.0 build."""
from __future__ import annotations

import asyncio
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from swarmz_runtime.intelligence.cosmic import (
    CosmicIntelligence,
    CosmicResponse,
    ScaleLevel,
    TimelineArtifact,
    ComparisonArtifact,
    MultiScaleResponse,
    _reasoning_depth,
    get_cosmic_intelligence,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_bridge(monkeypatch):
    """Patch call_v2 to return a mock BridgeResponse without hitting LLM."""
    mock_resp = MagicMock()
    mock_resp.content = "Deep reasoning output from mocked bridge."
    mock_resp.tokens_used = 850
    mock_resp.tier = 1

    async def _fake_call_v2(**kwargs):
        return mock_resp

    monkeypatch.setattr("swarmz_runtime.bridge.llm.call_v2", _fake_call_v2)
    return mock_resp


@pytest.fixture
def cosmic(tmp_path: Path, monkeypatch) -> CosmicIntelligence:
    """CosmicIntelligence with artifact logging redirected to tmp_path."""
    import swarmz_runtime.intelligence.cosmic as mod
    monkeypatch.setattr(mod, "_ARTIFACTS_DIR", tmp_path / "intelligence")
    monkeypatch.setattr(mod, "_COSMIC_LOG", tmp_path / "intelligence" / "cosmic.jsonl")
    monkeypatch.setattr(mod, "_COSMIC", None)
    return CosmicIntelligence()


# ---------------------------------------------------------------------------
# _reasoning_depth
# ---------------------------------------------------------------------------

def test_depth_surface():
    assert _reasoning_depth(0) == "SURFACE"
    assert _reasoning_depth(299) == "SURFACE"


def test_depth_deep():
    assert _reasoning_depth(300) == "DEEP"
    assert _reasoning_depth(799) == "DEEP"


def test_depth_profound():
    assert _reasoning_depth(800) == "PROFOUND"
    assert _reasoning_depth(10000) == "PROFOUND"


# ---------------------------------------------------------------------------
# ScaleLevel
# ---------------------------------------------------------------------------

def test_scale_level_values():
    assert ScaleLevel.QUANTUM.value == "quantum"
    assert ScaleLevel.COSMIC.value == "cosmic"
    assert ScaleLevel.MULTIVERSAL.value == "multiversal"


def test_scale_level_from_string():
    s = ScaleLevel("galactic")
    assert s == ScaleLevel.GALACTIC


def test_all_ten_scales_exist():
    scales = [s.value for s in ScaleLevel]
    assert len(scales) == 10
    assert "quantum" in scales
    assert "multiversal" in scales


# ---------------------------------------------------------------------------
# CosmicIntelligence.query() — guardian mode (no LLM)
# ---------------------------------------------------------------------------

def test_query_guardian_no_llm(cosmic: CosmicIntelligence, monkeypatch):
    """Guardian mode must never call LLM."""
    called = []

    async def _should_not_call(**kwargs):
        called.append(True)
        return MagicMock(content="x", tokens_used=0)

    monkeypatch.setattr("swarmz_runtime.bridge.llm.call_v2", _should_not_call)
    resp = cosmic.query("test prompt", ScaleLevel.HUMAN, mode="guardian")
    assert called == [], "Guardian mode must not call LLM"
    assert resp.mode == "guardian"
    assert resp.tokens_used == 0
    assert resp.reasoning_depth == "SURFACE"
    assert "GUARDIAN" in resp.content


def test_query_guardian_returns_cosmic_response(cosmic: CosmicIntelligence):
    resp = cosmic.query("anything", "human", mode="guardian")
    assert isinstance(resp, CosmicResponse)
    assert resp.scale == ScaleLevel.HUMAN


# ---------------------------------------------------------------------------
# CosmicIntelligence.query() — with bridge mock
# ---------------------------------------------------------------------------

def test_query_strategic_returns_response(cosmic: CosmicIntelligence, mock_bridge):
    resp = cosmic.query("What is the nature of time?", ScaleLevel.TEMPORAL, mode="strategic")
    assert isinstance(resp, CosmicResponse)
    assert resp.scale == ScaleLevel.TEMPORAL
    assert resp.mode == "strategic"


def test_query_depth_profound_on_high_tokens(cosmic: CosmicIntelligence, mock_bridge):
    mock_bridge.tokens_used = 900
    resp = cosmic.query("prompt", ScaleLevel.COSMIC, mode="strategic")
    assert resp.reasoning_depth == "PROFOUND"


def test_query_depth_surface_on_low_tokens(cosmic: CosmicIntelligence, mock_bridge):
    mock_bridge.tokens_used = 100
    resp = cosmic.query("prompt", ScaleLevel.QUANTUM, mode="strategic")
    assert resp.reasoning_depth == "SURFACE"


def test_query_string_scale_coerced(cosmic: CosmicIntelligence, mock_bridge):
    resp = cosmic.query("prompt", "stellar", mode="strategic")
    assert resp.scale == ScaleLevel.STELLAR


def test_query_artifact_id_generated(cosmic: CosmicIntelligence, mock_bridge):
    resp = cosmic.query("prompt", ScaleLevel.GALACTIC, mode="strategic")
    assert len(resp.artifact_id) == 16


def test_query_render_url_format(cosmic: CosmicIntelligence, mock_bridge):
    resp = cosmic.query("prompt", ScaleLevel.COSMIC, mode="strategic")
    assert resp.render_url.startswith("/v1/artifacts/")
    assert resp.render_url.endswith("/render/cosmic")


def test_query_bridge_error_returns_error_response(cosmic: CosmicIntelligence, monkeypatch):
    async def _fail(**kwargs):
        raise RuntimeError("bridge down")
    monkeypatch.setattr("swarmz_runtime.bridge.llm.call_v2", _fail)
    resp = cosmic.query("prompt", ScaleLevel.HUMAN, mode="strategic")
    assert "ERROR" in resp.content or "bridge down" in resp.content
    assert resp.tokens_used == 0


# ---------------------------------------------------------------------------
# CosmicIntelligence.query() — to_dict
# ---------------------------------------------------------------------------

def test_query_response_to_dict(cosmic: CosmicIntelligence, mock_bridge):
    resp = cosmic.query("prompt", ScaleLevel.HUMAN, mode="strategic")
    d = resp.to_dict()
    assert d["scale"] == "human"
    assert "content" in d
    assert "reasoning_depth" in d
    assert "tokens_used" in d


# ---------------------------------------------------------------------------
# CosmicIntelligence.timeline()
# ---------------------------------------------------------------------------

def test_timeline_returns_artifact(cosmic: CosmicIntelligence, mock_bridge):
    mock_bridge.content = "13800000000: Big Bang\n4500000000: Earth forms\n0: Present"
    mock_bridge.tokens_used = 400
    result = cosmic.timeline("Universe", -13_800_000_000, 2026)
    assert isinstance(result, TimelineArtifact)
    assert result.subject == "Universe"
    assert result.start_year == -13_800_000_000
    assert result.end_year == 2026


def test_timeline_events_parsed(cosmic: CosmicIntelligence, mock_bridge):
    mock_bridge.content = "1066: Norman conquest\n1215: Magna Carta\n1776: American independence"
    mock_bridge.tokens_used = 200
    result = cosmic.timeline("England", 1000, 1800)
    assert len(result.events) >= 2


def test_timeline_fallback_events_on_error(cosmic: CosmicIntelligence, monkeypatch):
    async def _fail(**kwargs):
        raise RuntimeError("err")
    monkeypatch.setattr("swarmz_runtime.bridge.llm.call_v2", _fail)
    result = cosmic.timeline("Stars", 0, 1000)
    assert len(result.events) >= 2  # fallback always provides 2 events


# ---------------------------------------------------------------------------
# CosmicIntelligence.compare()
# ---------------------------------------------------------------------------

def test_compare_returns_artifact(cosmic: CosmicIntelligence, mock_bridge):
    result = cosmic.compare("Rome", "Han Dynasty", ScaleLevel.CIVILIZATIONAL)
    assert isinstance(result, ComparisonArtifact)
    assert result.subject_a == "Rome"
    assert result.subject_b == "Han Dynasty"
    assert result.scale == ScaleLevel.CIVILIZATIONAL


def test_compare_to_dict(cosmic: CosmicIntelligence, mock_bridge):
    result = cosmic.compare("A", "B", "human")
    d = result.to_dict()
    assert "subject_a" in d
    assert "similarities" in d
    assert "differences" in d
    assert "synthesis" in d


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

def test_get_cosmic_intelligence_singleton():
    c1 = get_cosmic_intelligence()
    c2 = get_cosmic_intelligence()
    assert c1 is c2
