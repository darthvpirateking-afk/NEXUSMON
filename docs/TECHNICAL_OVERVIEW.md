# NEXUSMON Technical Overview

This document is the sober engineering companion to the public README.

Its purpose is to describe the currently verified system shape without mythic framing, and to separate present implementation truth from strategic direction.

---

## Scope

This overview describes the current validated local state as of 2026-03-07.

It focuses on:

- active runtime entry points
- active and legacy UI surfaces
- verified backend capabilities
- current validation state
- migration boundaries that still matter

For doctrine and product framing, see `docs/DOCTRINE.md` and `README.md`.

---

## Canonical Entry Points

### Backend

- Primary application surface: `nexusmon_server.py`
- Mirrored runtime surface: `swarmz_runtime/api/server.py`
- Shared domain and governance logic: `core/`
- Runtime engine, bridge, storage, and routers: `swarmz_runtime/`

### Frontend

- Active cockpit: `frontend/` (React + Vite)
- Legacy cockpit surface: `cockpit/` (Preact prototype)

### Agent / Guardrail Surface

- Custom agent manifests: `.github/agents/`
- Guardrail validation tooling: `tools/validate_agent_guardrails.py`
- Guardrail schema and policy: `schemas/agent-handoff.v1.json`, `config/agent_runtime_policy.json`

---

## Verified Current Capabilities

The following are safe present-tense claims based on the current validated repo state and recent local validation work.

- FastAPI runtime with lifespan-managed startup behavior
- governed mission execution path
- multi-provider LLM routing
- token budget and routing guardrails
- artifact persistence
- reversible snapshot layer
- audit logging and SSE-capable streaming paths
- persisted evolution / XP state
- companion mode support
- custom agent guardrail validation with CI coverage

The cockpit is partially live.

Verified live or partially-live areas include health polling, XP polling, and audit wiring. Other panels are still moving from placeholder or mixed state toward backend-backed truth.

---

## Validation State

Latest validated local snapshot:

- Platform: Windows / Python 3.11.9
- Full pytest result: `1689 passed, 1 skipped`
- Validation date: 2026-03-07

Primary reference: `docs/status/local_validation_2026-03-07.md`

This document should be treated as the source of truth for current local validation claims used in public-facing copy.

---

## Request / Runtime Shape

At a high level, the current governed path is:

`create -> validate -> execute -> persist`

Supporting runtime layers around that path include:

- bridge routing and provider selection
- governance / policy checks
- artifact persistence
- audit emission
- evolution state updates where applicable

This is the core reason the system can be described as more than a UI shell: the mission-bearing backend path is real and tested.

---

## Repository Surfaces

### Active Surfaces

- `nexusmon_server.py`
- `swarmz_runtime/api/server.py`
- `core/`
- `swarmz_runtime/`
- `frontend/`
- `tests/`
- `docs/`

### Historical or Secondary Surfaces

- `cockpit/`
- `operator_interface/`
- `mobile/`
- `swarmz/`, `swarmz_app/`, `apps/`

### Archived Surfaces

- `archive/operator/operator_console/`
- `archive/dev/demo_scripts/`
- `archive/tools/paste-agent/`
- `archive/static/public/`
- `archive/tools/forge/`

### Generated / Runtime State Areas

- `artifacts/`
- `data/`
- `prepared_actions/`

For a path-by-path layout explanation, see `docs/repository_layout.md`.

---

## Current Migration Boundaries

The main migration boundary in the system is not backend existence; it is frontend truthfulness and naming normalization.

Current active migration themes:

- finishing cockpit panel wiring against backend truth
- reducing remaining simulated or placeholder UI state
- continuing intentional `swarmz` to `nexusmon` normalization
- keeping compatibility shims only where they still protect working behavior

This means the current honest description is:

> a truthful backend with an increasingly truthful cockpit

It is not yet accurate to describe every operator surface as fully live.

---

## Branch and Operational Policy

- Canonical branch: `main`
- Legacy branch: `master`
- Branch normalization status: operationally complete for live policy files

Primary references:

- `docs/status/branch_normalization_complete_2026-03-07.md`
- `docs/CONTRIBUTING.md`

---

## Related Documents

- `README.md` — public-facing overview
- `docs/DOCTRINE.md` — doctrine and operator law
- `docs/repository_layout.md` — repo navigation guide
- `docs/truthful_migration_playbook.md` — migration strategy
- `docs/status/local_validation_2026-03-07.md` — current validation snapshot

Older architecture and boundary docs still exist and may contain useful historical design context, but this file is intended to be the concise current-state technical reference.