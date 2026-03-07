from __future__ import annotations

import json
from pathlib import Path

import jsonschema


REPO_ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = REPO_ROOT / ".github" / "agents"
HANDOFF_SCHEMA_PATH = REPO_ROOT / "schemas" / "agent-handoff.v1.json"
HANDOFF_EXAMPLE_PATH = REPO_ROOT / "config" / "agent_handoff.example.json"
RUNTIME_POLICY_PATH = REPO_ROOT / "config" / "agent_runtime_policy.json"
ORCHESTRATION_PLAN_PATH = REPO_ROOT / "docs" / "agent_orchestration_plan.md"
EXPECTED_ALLOWED_COMMANDS = [
    "uv --version",
    "uv self update",
    "uv sync",
    "uv run pytest tests/ --tb=short -q",
    "pytest tests/ --tb=short -q",
    "pytest <targeted test path> --tb=short -q",
    "git status --short --branch",
    "Get-ChildItem <approved path>",
]
EXPECTED_COMMAND_LOG_FIELDS = ["timestamp", "agent", "command", "result"]


def _split_inline_list(raw_value: str) -> list[str]:
    inner = raw_value[1:-1].strip()
    if not inner:
        return []
    return [item.strip().strip('"').strip("'") for item in inner.split(",")]


def parse_frontmatter(agent_path: Path) -> dict[str, object]:
    text = agent_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if len(lines) < 3 or lines[0].strip() != "---":
        raise ValueError(f"{agent_path.name}: missing frontmatter start")

    try:
        end_index = lines[1:].index("---") + 1
    except ValueError as exc:
        raise ValueError(f"{agent_path.name}: missing frontmatter end") from exc

    frontmatter_lines = lines[1:end_index]
    parsed: dict[str, object] = {}
    for line in frontmatter_lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"{agent_path.name}: invalid frontmatter line '{line}'")
        key, raw_value = line.split(":", 1)
        key = key.strip()
        value = raw_value.strip()
        if value.startswith("[") and value.endswith("]"):
            parsed[key] = _split_inline_list(value)
        elif value in {"true", "false"}:
            parsed[key] = value == "true"
        elif value.startswith('"') and value.endswith('"'):
            parsed[key] = value[1:-1]
        elif value.startswith("'") and value.endswith("'"):
            parsed[key] = value[1:-1]
        else:
            parsed[key] = value
    return parsed


def validate_guardrails() -> None:
    schema = json.loads(HANDOFF_SCHEMA_PATH.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(schema)
    validator = jsonschema.Draft202012Validator(schema)

    handoff_example = json.loads(HANDOFF_EXAMPLE_PATH.read_text(encoding="utf-8"))
    handoff_errors = list(validator.iter_errors(handoff_example))
    if handoff_errors:
        messages = ", ".join(error.message for error in handoff_errors)
        raise ValueError(f"agent handoff example invalid: {messages}")

    runtime_policy = json.loads(RUNTIME_POLICY_PATH.read_text(encoding="utf-8"))
    required_runtime_keys = {
        "version",
        "agent",
        "deny_by_default",
        "allowed_commands",
        "denied_command_categories",
        "required_command_log_fields",
    }
    missing_runtime_keys = sorted(required_runtime_keys - runtime_policy.keys())
    if missing_runtime_keys:
        raise ValueError(f"runtime policy missing keys: {missing_runtime_keys}")
    if runtime_policy.get("agent") != "Nexusmon Runtime":
        raise ValueError("runtime policy agent must be 'Nexusmon Runtime'")
    if runtime_policy.get("deny_by_default") is not True:
        raise ValueError("runtime policy must deny by default")
    if runtime_policy.get("allowed_commands") != EXPECTED_ALLOWED_COMMANDS:
        raise ValueError("runtime policy allowed_commands drifted from the enforced baseline")
    if runtime_policy.get("required_command_log_fields") != EXPECTED_COMMAND_LOG_FIELDS:
        raise ValueError("runtime policy required_command_log_fields drifted from the enforced baseline")

    required_frontmatter = {
        "description",
        "tools",
    }

    for agent_path in sorted(AGENTS_DIR.glob("*.agent.md")):
        frontmatter = parse_frontmatter(agent_path)
        missing_frontmatter = sorted(required_frontmatter - frontmatter.keys())
        if missing_frontmatter:
            raise ValueError(f"{agent_path.name}: missing frontmatter keys {missing_frontmatter}")
        agent_text = agent_path.read_text(encoding="utf-8")
        if "schemas/agent-handoff.v1.json" not in agent_text:
            raise ValueError(f"{agent_path.name}: missing handoff schema reference")
        if "## Handoff Behavior" not in agent_text:
            raise ValueError(f"{agent_path.name}: missing handoff behavior section")

    runtime_frontmatter = parse_frontmatter(AGENTS_DIR / "nexusmon-runtime.agent.md")
    if "execute" not in runtime_frontmatter.get("tools", []):
        raise ValueError("nexusmon-runtime.agent.md must expose execute tool")

    runtime_text = (AGENTS_DIR / "nexusmon-runtime.agent.md").read_text(encoding="utf-8")
    if "config/agent_runtime_policy.json" not in runtime_text:
        raise ValueError("nexusmon-runtime.agent.md must reference the runtime policy as source of truth")

    builder_frontmatter = parse_frontmatter(AGENTS_DIR / "nexusmon-builder.agent.md")
    if "execute" in builder_frontmatter.get("tools", []):
        raise ValueError("nexusmon-builder.agent.md must not expose execute tool")

    plan_text = ORCHESTRATION_PLAN_PATH.read_text(encoding="utf-8")
    for required_phrase in [
        "## Gate Matrix",
        "config/agent_runtime_policy.json",
        "schemas/agent-handoff.v1.json",
    ]:
        if required_phrase not in plan_text:
            raise ValueError(f"orchestration plan missing '{required_phrase}'")


if __name__ == "__main__":
    validate_guardrails()