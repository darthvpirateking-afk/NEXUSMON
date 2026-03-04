"""Tests for cosmic keyword routing in companion voice — Task 4 of v2.1.0."""
from __future__ import annotations

import asyncio
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from swarmz_runtime.companion.voice import (
    _is_cosmic_prompt,
    _detect_scale,
    _COSMIC_KEYWORDS,
    CompanionResponse,
)


# ---------------------------------------------------------------------------
# _is_cosmic_prompt
# ---------------------------------------------------------------------------

def test_cosmic_prompt_strategic_with_keyword():
    assert _is_cosmic_prompt("Tell me about the universe", "strategic") is True


def test_cosmic_prompt_combat_not_routed():
    assert _is_cosmic_prompt("Tell me about the universe", "combat") is False


def test_cosmic_prompt_guardian_not_routed():
    assert _is_cosmic_prompt("What is the cosmos?", "guardian") is False


def test_cosmic_prompt_no_keywords():
    assert _is_cosmic_prompt("What is your current status?", "strategic") is False


def test_cosmic_prompt_keyword_in_middle():
    assert _is_cosmic_prompt("I want to understand quantum computing", "strategic") is True


def test_cosmic_prompt_history_keyword():
    assert _is_cosmic_prompt("Tell me about ancient history", "strategic") is True


def test_cosmic_prompt_case_insensitive():
    assert _is_cosmic_prompt("What is the UNIVERSE made of?", "strategic") is True


# ---------------------------------------------------------------------------
# _detect_scale
# ---------------------------------------------------------------------------

def test_detect_scale_quantum():
    assert _detect_scale("explain quantum entanglement") == "quantum"


def test_detect_scale_cosmic():
    assert _detect_scale("what is dark matter in the universe?") == "cosmic"


def test_detect_scale_civilizational():
    assert _detect_scale("tell me about ancient civilizations and empires") == "civilizational"


def test_detect_scale_stellar():
    assert _detect_scale("how do neutron stars form?") == "stellar"


def test_detect_scale_temporal():
    assert _detect_scale("project the future of humanity across deep time") == "temporal"


def test_detect_scale_default_human():
    assert _detect_scale("who are you") == "human"


def test_detect_scale_planetary():
    assert _detect_scale("what caused the mass extinction on earth?") == "planetary"


# ---------------------------------------------------------------------------
# CompanionResponse — new fields
# ---------------------------------------------------------------------------

def test_companion_response_to_dict_includes_scale_when_set():
    r = CompanionResponse(
        reply="test", mode="strategic", tier_used="CORTEX",
        tokens=100, latency_ms=50.0,
        scale_used="cosmic", depth="PROFOUND", worldspace_id="abc123",
    )
    d = r.to_dict()
    assert d["scale_used"] == "cosmic"
    assert d["depth"] == "PROFOUND"
    assert d["worldspace_id"] == "abc123"


def test_companion_response_to_dict_omits_none_fields():
    r = CompanionResponse(
        reply="test", mode="combat", tier_used="REFLEX",
        tokens=50, latency_ms=20.0,
    )
    d = r.to_dict()
    assert "scale_used" not in d
    assert "depth" not in d
    assert "worldspace_id" not in d


def test_companion_response_required_fields_always_present():
    r = CompanionResponse(
        reply="hi", mode="strategic", tier_used="CORTEX",
        tokens=0, latency_ms=0.0,
    )
    d = r.to_dict()
    assert "reply" in d
    assert "mode" in d
    assert "tier_used" in d


# ---------------------------------------------------------------------------
# Keyword coverage
# ---------------------------------------------------------------------------

def test_cosmic_keywords_not_empty():
    assert len(_COSMIC_KEYWORDS) > 20


def test_cosmic_keywords_includes_core_words():
    assert "universe" in _COSMIC_KEYWORDS
    assert "quantum" in _COSMIC_KEYWORDS
    assert "history" in _COSMIC_KEYWORDS
    assert "multiverse" in _COSMIC_KEYWORDS
