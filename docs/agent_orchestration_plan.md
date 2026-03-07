# Nexusmon Agent Orchestration Plan

## Primary Bottleneck
Current priority: safer builds and reliable test runs.

Reason:
- The full pytest suite is currently blocked by corrupted runtime snapshot data leaking into test collection through `core/reversible.py`.
- Until build and test execution are isolated and auditable, faster feature delivery is secondary.

## Hybrid Model
- `Nexusmon Builder`: default implementer for backend and cross-slice changes.
- `Nexusmon Reviewer`: read-only audit for regressions, mirrored-server gaps, and missing tests.
- `Nexusmon Cockpit`: UI and hook specialist.
- `Nexusmon Runtime`: the only agent allowed to execute approved terminal commands.

## Orchestration Sequence
1. Run `Nexusmon Builder` for implementation planning and additive patches.
2. In parallel when safe, run:
   - `Nexusmon Reviewer` for read-only regression checks.
   - `Nexusmon Cockpit` for UI-specific implementation or review.
3. Merge only non-conflicting file changes.
4. Gate runtime execution on both conditions:
   - A handoff report says `ready-for-runtime`.
   - The requested command is on the runtime whitelist.
5. Run `Nexusmon Runtime` for `uv`, pytest, or approved verification commands.
6. Return to `Nexusmon Reviewer` if runtime output reveals regressions or incomplete coverage.

## Parallelism Rules
- Safe to parallelize:
  - read-only discovery
  - read-only regression review
  - UI work that does not touch the same files as backend edits
- Must stay serialized:
  - edits to the same file set
  - mirrored server endpoint changes
  - runtime/build/test execution

## Required Handoff Report
Every agent handoff must include:
- summary
- gate_status
- next_agent
- changed_files
- commands_run
- runtime_needed
- tests_status
- remaining_steps
- confidence

## Gate Matrix
| Producer | Required Artifact | Validator | Pass Rule | Block Rule |
|---|---|---|---|---|
| `Nexusmon Builder` | handoff JSON matching `schemas/agent-handoff.v1.json` | guardrail validator | `gate_status` is `ready-for-review` or `ready-for-runtime` | missing schema fields or unresolved blockers |
| `Nexusmon Reviewer` | handoff JSON matching `schemas/agent-handoff.v1.json` | guardrail validator | `gate_status` is `approved` | any finding marked blocking or missing mirror coverage |
| `Nexusmon Cockpit` | handoff JSON matching `schemas/agent-handoff.v1.json` | guardrail validator | UI checklist complete and `gate_status` is review/runtime ready | unresolved backend dependency or missing mobile checklist item |
| `Nexusmon Runtime` | handoff JSON matching `schemas/agent-handoff.v1.json` plus command log | runtime policy validator | every command is on the allowlist and results/artifacts are captured | any non-whitelisted command or incomplete command log |

## Runtime Allowlist
Source of truth: `config/agent_runtime_policy.json`

Denied by default:
- arbitrary shell exploration
- destructive git commands
- deployment commands
- any command not explicitly listed above

## Mobile, Performance, And Telemetry Tracks
- Mobile readiness: require responsive checks, touch-target review, and offline behavior notes in cockpit handoffs before runtime validation.
- Performance: add benchmark deltas and hot-path notes to reviewer or runtime handoffs when CPU-sensitive paths are touched.
- Observability: require runtime handoffs to report artifacts, health endpoint checks, and rollback notes for any build or test run that changes deployable behavior.

## Immediate Follow-up
1. Isolate reversible snapshot test data from live runtime artifacts.
2. Add malformed JSONL handling to `core/reversible.py` with explicit visibility.
3. Re-run the full pytest suite through `Nexusmon Runtime`.