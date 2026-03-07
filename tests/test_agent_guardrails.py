from __future__ import annotations

import json
from pathlib import Path

import jsonschema

from tools.validate_agent_guardrails import parse_frontmatter, validate_guardrails


REPO_ROOT = Path(__file__).resolve().parent.parent


def test_validate_guardrails_passes() -> None:
    validate_guardrails()


def test_agent_handoff_example_matches_schema() -> None:
    schema_path = REPO_ROOT / "schemas" / "agent-handoff.v1.json"
    example_path = REPO_ROOT / "config" / "agent_handoff.example.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    example = json.loads(example_path.read_text(encoding="utf-8"))
    validator = jsonschema.Draft202012Validator(schema)
    errors = list(validator.iter_errors(example))
    assert not errors, [error.message for error in errors]


def test_runtime_agent_references_single_source_policy() -> None:
    frontmatter = parse_frontmatter(
        REPO_ROOT / ".github" / "agents" / "nexusmon-runtime.agent.md"
    )
    assert "execute" in frontmatter["tools"]
    runtime_text = (
        REPO_ROOT / ".github" / "agents" / "nexusmon-runtime.agent.md"
    ).read_text(encoding="utf-8")
    assert "config/agent_runtime_policy.json" in runtime_text


def test_runtime_policy_has_expected_baseline() -> None:
    runtime_policy = json.loads(
        (REPO_ROOT / "config" / "agent_runtime_policy.json").read_text(encoding="utf-8")
    )
    assert runtime_policy["allowed_commands"] == [
        "uv --version",
        "uv self update",
        "uv sync",
        "uv run pytest tests/ --tb=short -q",
        "pytest tests/ --tb=short -q",
        "pytest <targeted test path> --tb=short -q",
        "git status --short --branch",
        "Get-ChildItem <approved path>",
    ]
    assert runtime_policy["required_command_log_fields"] == [
        "timestamp",
        "agent",
        "command",
        "result",
    ]


def test_builder_does_not_expose_execute_tool() -> None:
    frontmatter = parse_frontmatter(
        REPO_ROOT / ".github" / "agents" / "nexusmon-builder.agent.md"
    )
    assert "execute" not in frontmatter["tools"]