# Truthful Migration Playbook

This document captures the safe evolution strategy for moving NEXUSMON from mixed real-plus-simulated surfaces toward a truthful, governed operator runtime without breaking the living parts that already work.

## Prime Rule

Do not rewrite the system. Preserve working behavior, add fences around it, and migrate by adapters, read models, feature flags, and reversible vertical slices.

## 1. Freeze Reality First

Before changing architecture, lock down what is already real.

Create or maintain characterization coverage for:

- passing tests
- working endpoints
- current cockpit routes
- current SQLite schema
- current artifact and evolution persistence
- current SSE behavior
- current companion responses

These are not elegance tests. They are do-not-break-reality tests.

Examples:

- mission create, validate, and run still works
- artifact vault versioning still writes JSONL correctly
- evolution XP survives restart
- `/v1/companion/nexusmon` still responds the same way under current conditions
- `/api/health/deep` and `/api/avatar/xp` still return their current shapes

## 2. Use The Strangler Pattern

Build new canonical behavior around the old system, then route traffic inward one slice at a time.

Rules:

- keep existing endpoints alive
- keep the current frontend boot path alive
- introduce canonical services behind adapters
- migrate one panel, endpoint, or event stream at a time

Pattern:

1. Keep the current endpoint.
2. Add a canonical service behind it.
3. Have the endpoint read through an adapter.
4. Switch one UI panel to the new read model.
5. Verify behavior.
6. Retire legacy wiring only after repeated proof.

## 3. Define Canonical Domain Models Early

Stabilize the core nouns before broad cleanup.

Initial canonical model set:

- Mission
- MissionRun
- Artifact
- ArtifactVersion
- AuditEvent
- ActionEnvelope
- SystemCondition
- ProviderStatus
- AvatarState
- ApprovalRecord

Later models:

- PolicyDecision
- MissionTwin
- ExecutionBranch
- DeliberationRecord
- CausalEdge
- Genome
- BenchmarkRun
- RollbackPlan

Guideline:

- current SQLite missions table becomes an adapter to Mission
- current audit append-only log becomes an adapter to AuditEvent
- current XP JSON becomes an adapter to AvatarState or EvolutionState

## 4. Separate Write Path From Read Path

This is the safest upgrade axis.

Keep the existing write path mostly intact at first:

- create mission
- validate mission
- run mission
- persist artifacts
- append audit log

Build cockpit-specific read models separately:

- mission list
- artifact list
- provider conditions
- avatar state
- recent actions
- audit stream

Principle:

- backend execution remains authoritative
- event streams publish state changes
- cockpit consumes read models

## 5. Put New Behavior Behind Feature Flags

Every major addition should be switchable.

Suggested flags:

- `ENABLE_WS_RUNTIME`
- `ENABLE_REAL_MISSION_PANEL`
- `ENABLE_REAL_ARTIFACT_PANEL`
- `ENABLE_PROOF_ENVELOPES`
- `ENABLE_MISSION_TWIN`
- `ENABLE_MODEL_PARLIAMENT`
- `ENABLE_EVOLUTION_LAB`

Flag discipline:

- default off in early development
- enable in dev first
- then staging
- then selective production rollout

## 6. Use Shadow Reads And Shadow Writes

Before making a new path authoritative, run it in parallel.

Shadow read:

- panel fetches old source and new canonical source
- system compares results in logs or tests

Shadow write:

- current persistence path still writes as usual
- new event or read-model builder writes in parallel
- old path remains authoritative until results match consistently

## 7. Migrate By Vertical Slice

Do not migrate by technical layer alone.

Recommended order:

### Slice 1: Mission List

- keep mission execution as-is
- add canonical Mission read model
- expose or preserve `GET /api/missions`
- wire cockpit mission panel to real backend data
- retain old UI fallback behind a flag

### Slice 2: Artifact Vault

- canonical Artifact and ArtifactVersion
- real `/api/artifacts`
- real cockpit artifact panel

### Slice 3: Avatar State

- backend-generated avatar state from real events
- remove local simulated process/responding state from active UI

### Slice 4: Provider And System Conditions

- explicit missing-key and offline-mode states
- visible in cockpit

### Slice 5: Action Envelopes And Proof Bundles

- attach evidence and reversibility metadata to real actions

Only after those slices are stable should the repo move into Mission Twin, Parliament, Evolution Lab, or rollback console work.

## 8. Do Not Unify The Two Servers First

Dual-server cleanup is lower value than truthful state.

For now:

- leave the two-server awkwardness alone
- keep compatibility facades where needed
- consolidate only after domain contracts and read models are stable

## 9. Define The Event Contract Before Rewriting Transport

Transport is secondary. Event schema comes first.

Example:

```json
{
  "type": "mission.phase_changed",
  "timestamp": "2026-03-07T12:34:56Z",
  "mission_id": "M-184",
  "run_id": "RUN-991",
  "payload": {
    "from": "planning",
    "to": "executing",
    "provider": "openai",
    "model": "gpt-4o"
  }
}
```

Core event families:

- `mission.created`
- `mission.completed`
- `mission.phase_changed`
- `artifact.created`
- `artifact.versioned`
- `companion.processing`
- `companion.responded`
- `provider.degraded`
- `system.condition_changed`
- `policy.blocked`
- `rollback.available`

Once stable, the same event contract can feed:

- SSE
- WebSocket
- read-model builders
- tests

## 10. Make Every New Feature Reversible

Do not ship irreversible features.

Each major addition should include:

- a feature flag
- a fallback path
- schema versioning if needed
- an adapter layer
- rollback notes or migration reversal steps

## Safe Build Order

### Phase A: Protect The Current System

- add characterization tests
- add feature flags
- define canonical models
- define event contract
- add system-condition endpoint

### Phase B: Make The Cockpit Truthful

- real mission read model
- real artifact read model
- backend-driven avatar state
- visible provider and offline status
- fix active controls like SEAL and TRANSMIT to reflect backend truth only

### Phase C: Add Governance Primitives

- ActionEnvelope
- ApprovalRecord
- PolicyDecision
- reversibility metadata

### Phase D: Add Advanced Intelligence

- Mission Twin
- Model Parliament
- causal graph
- Evolution Lab
- Shadow Board
- rollback console

## What Not To Do

Avoid these traps:

- do not rewrite the whole frontend to clean it up
- do not merge both servers before stabilizing contracts
- do not replace SQLite or storage format early
- do not add Mission Twin before the cockpit reflects real mission truth
- do not keep fake UI data once real equivalents exist on the active path
- do not ship silent fallback behavior for missing keys or offline mode

## Suggested Additive Repo Shape

This can be introduced gradually without a mass move:

```text
nexusmon/
  api/
    routes/
      missions.py
      artifacts.py
      runtime.py
      companion.py
  domain/
    models/
      mission.py
      artifact.py
      audit.py
      action.py
      runtime.py
    services/
      mission_service.py
      artifact_service.py
      runtime_service.py
      proof_service.py
  adapters/
    db/
      sqlite_missions.py
      sqlite_artifacts.py
    events/
      sse_publisher.py
      ws_publisher.py
      audit_log_bus.py
    llm/
      openai_adapter.py
      groq_adapter.py
  readmodels/
    missions_view.py
    artifacts_view.py
    cockpit_view.py
  evolution/
  simulation/
  policies/
  tests/
```

Intent:

- domain = canonical truth
- adapters = implementation glue
- readmodels = cockpit-facing views
- api = transport surface

## Coding-Agent Prompt

Use this prompt when assigning the incremental migration work:

```text
You are the lead refactor and architecture agent for the NEXUSMON codebase.

Your mission:
Evolve NEXUSMON from a partially simulated cockpit with a real backend into a truthful, governed, real-time operator runtime without breaking existing working behavior.

Core constraints:
- Do NOT rewrite the system from scratch.
- Do NOT remove or break existing working endpoints unless explicitly instructed.
- Preserve current mission lifecycle, artifact storage, evolution persistence, companion behavior, audit logging, and passing tests.
- Prefer adapters, facades, read models, and feature flags over invasive rewrites.
- Every major change must be incremental, reversible, and test-backed.
- Treat the current working backend as the source of operational value.
- Treat the current simulated cockpit as a migration target, not a foundation to destroy blindly.
- Never replace real behavior with speculative abstractions.
- Be explicit about uncertainty and blast radius before making changes.

Project truth:
- Backend is real in key areas: LLM routing, missions, SQLite persistence, evolution XP persistence, artifact vault, audit log/SSE, many endpoints.
- Cockpit UI is partially simulated with hardcoded mission/artifact/state data.
- Missing provider keys and offline mode can disable meaningful execution.
- There are dual server surfaces with overlapping endpoints.
- The immediate goal is truthful state and safe evolution, not aesthetic refactoring.

Architectural doctrine:
1. Freeze and protect existing behavior with characterization tests.
2. Introduce canonical domain models incrementally.
3. Build cockpit-facing read models instead of rewriting execution first.
4. Add a stable runtime event schema before transport changes.
5. Use feature flags for every major new capability.
6. Migrate one vertical slice at a time.
7. Use shadow reads and writes before cutover.
8. Keep changes reversible.

Canonical models to introduce gradually:
- Mission
- MissionRun
- Artifact
- ArtifactVersion
- AuditEvent
- ActionEnvelope
- SystemCondition
- ProviderStatus
- AvatarState
- ApprovalRecord
Later:
- PolicyDecision
- MissionTwin
- ExecutionBranch
- DeliberationRecord
- CausalEdge
- Genome
- BenchmarkRun
- RollbackPlan

Current priority order:
Priority 1:
- Remove hardcoded cockpit mission/artifact data by wiring real backend read endpoints.
- Expose explicit runtime/provider/system conditions.
- Make avatar state driven by backend events instead of local simulation.
- Fix SEAL and TRANSMIT reducer behavior.
- Add feature flags and characterization tests around all existing working behavior.

Priority 2:
- Add runtime event contract and WebSocket/SSE unified event publishing.
- Add ActionEnvelope proof-carrying metadata for important actions.
- Add approval and policy-decision structures.
- Build cockpit read models for missions, artifacts, provider health, avatar state, and recent actions.

Priority 3:
- Implement Mission Twin simulation, Model Parliament, causal graph, rollback metadata, and Evolution Lab only after truthful runtime state is stable.

Required working style:
- Start by inspecting current code paths and summarizing what already exists.
- Propose the smallest viable change set for the next step.
- Name exact files to change before changing them.
- Prefer additive changes over destructive edits.
- Add tests for any changed behavior.
- Keep endpoint compatibility whenever possible.
- If a refactor is needed, introduce a compatibility layer first.
- Log all assumptions and unresolved questions.
- Do not invent functionality that is not actually present in the repo.

For each task, output in this format:
1. Goal
2. Existing behavior discovered
3. Risks
4. Smallest safe implementation plan
5. Files to modify
6. Tests to add or update
7. Rollback strategy
8. Then provide the code changes

Your first assignment:
Audit the current repo and produce a migration plan for the first truthful vertical slice:
- canonical Mission read model
- GET /api/missions endpoint or adapter preservation
- cockpit mission panel wired to real backend data behind a feature flag
- no breakage to existing mission execution flow

Do not attempt Mission Twin, Model Parliament, or broad server unification yet.
```

## Immediate Recommendation

If only one next slice is taken, make the mission panel real first. That slice teaches the core migration pattern with the lowest acceptable blast radius:

- canonical model mapping
- additive read endpoint work
- truthful cockpit wiring
- feature-flagged fallback
- execution-path preservation
