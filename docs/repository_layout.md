# Repository Layout

This document exists to make the top-level NEXUSMON tree navigable without forcing a risky mass-move of folders that may still be referenced by scripts, tests, or operator workflows.

## Active Surfaces

| Path | Purpose |
|------|---------|
| `nexusmon_server.py` | Primary FastAPI application surface |
| `swarmz_runtime/api/server.py` | Runtime/kernel mirror surface |
| `core/` | Shared core logic, manifests, canonical adapters |
| `swarmz_runtime/` | Runtime engine, storage, bridge, API routers |
| `frontend/` | Active React + Vite frontend |
| `tests/` | Main automated test suite |
| `docs/` | Architecture and migration documentation |

## Historical Or Secondary Surfaces

| Path | Purpose |
|------|---------|
| `cockpit/` | Legacy Preact cockpit prototype |
| `operator_interface/` | Additional UI/operator surface |
| `mobile/` | Mobile-facing work and experiments |
| `swarmz/`, `swarmz_app/`, `apps/` | Older or adjacent application surfaces |

## Archived Surfaces

| Path | Purpose |
|------|---------|
| `archive/operator/operator_console/` | Archived operator console scaffold moved out of root during compaction |
| `archive/dev/demo_scripts/` | Optional demo and simulation helpers moved out of root during compaction |
| `archive/tools/paste-agent/` | Archived paste-agent sandbox moved out of root during compaction |
| `archive/static/public/` | Archived root static plugin payloads moved out of root during compaction |
| `archive/tools/forge/` | Archived standalone forge script surface moved out of root during compaction |

## Runtime / Generated Areas

| Path | Purpose |
|------|---------|
| `artifacts/` | Runtime artifacts and generated outputs |
| `data/` | Runtime state, logs, and persisted data |
| `observatory/` | Cleanup reports and operational logs |
| `hologram_snapshots/` | Generated snapshot output |
| `prepared_actions/` | Generated plans, schedules, and actions |

## Why The Root Looks Busy

The current root combines:

- active product code
- preserved historical surfaces
- generated runtime evidence
- operator tooling
- recovery and backup material

That keeps the repository additive, but it also makes discovery slower. The safe normalization approach is:

1. Document the active surfaces clearly.
2. Keep generated and backup content ignored.
3. Move directories only after confirming import paths, scripts, and deployment references.
4. Land structural moves on a dedicated cleanup branch, not mixed with feature work.

## Cleanup Backlog

- Consolidate active frontend references around `frontend/`.
- Decide whether `cockpit/` remains a maintained surface or becomes archived-only.
- Audit top-level alternate UI directories for active references before moving them.
- Remove or archive obsolete local backup folders outside Git tracking.
- Keep `README.md` aligned with the actual active entry points.
- Continue evaluating `design/` for additional low-risk root compaction.

For a dedicated root cleanup sequence that would make the GitHub top level substantially less noisy, see [docs/root_compaction_plan_2026-03-07.md](docs/root_compaction_plan_2026-03-07.md).