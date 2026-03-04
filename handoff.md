## Handoff for Claude

### Snapshot (2026-03-03, branch `evolution/evolution_controller_install`)
- Working tree ahead of origin by 10 commits; dirty with staged/unstaged edits.
- Key touched files: `.claude/settings.local.json`, `core/manifests/registry.json`, `frontend/src/App.tsx`, `prepared_actions/schedules/cat_test_schedule/proposal.json`, `swarmz_runtime/api/server.py`, `swarmz_runtime/core/engine.py`, `swarmz_server.py`.
- New/untracked additions include `frontend/src/components/NexusmonBridgeHealth.tsx`, `NexusmonBridgeOutput.tsx`, `NexusmonModeSelector.tsx`, `frontend/src/hooks/useBridgeHealth.ts`, `useBridgeOutput.ts`, `frontend/src/pages/NexusmonPage.tsx`, and new tests `tests/test_engine_bridge_output_surface.py`, `tests/test_health_bridge_endpoint.py`.

### What changed (high level)
- Added a Nexusmon operator UI page (`frontend/src/pages/NexusmonPage.tsx`) that composes:
  - `NexusmonModeSelector` (strategic/combat/guardian modes; visual toggles only for now).
  - `NexusmonBridgeHealth` (polls `/api/health/bridge`, surfaces provider list and circuit breaker state; refresh button).
  - `NexusmonBridgeOutput` + `useBridgeOutput` hook (simple listener-based state fanout so backend pushes can update UI).
- Backend bridge work (files above) was touched to support the health/output surfaces; verify endpoints `/api/health/bridge` and bridge output emitter align with the new hooks.
- Local Claude config tweaked (`.claude/settings.local.json`); keep an eye on secrets.

### How to run
- Backend: run existing server entry `python swarmz_server.py` (or project-standard runner) from repo root; ensure `.env` is populated (see `.env.example`).
- Frontend: if using the Vite app under `frontend/`, run `npm install` (already have `node_modules` in tree) then `npm run dev` from `frontend`. Main app entry `frontend/src/App.tsx` now likely needs to import/render `NexusmonPage`.
- Tests: Python side uses `pytest` (see `pytest.ini`); JS side uses `npm test` (Jest). New tests under `tests/` will exercise bridge health/output.

### Open questions / follow-ups
- Confirm `/api/health/bridge` response schema: `{status, providers, circuit_breaker, budget, mode_table}`; adjust frontend types if backend differs.
- Ensure bridge output setter (`setBridgeOutput`) is invoked wherever the backend emits operator-facing text; otherwise UI stays empty.
- Verify guardian mode expectation: should it block outbound LLM calls in backend? check `swarmz_runtime/core/engine.py`.
- Clean up large artifacts before commit if unneeded: `node_modules/`, `artifacts.legacy-file`, bundle files.

### Next steps for Claude
1) Pull latest and keep branch `evolution/evolution_controller_install`.
2) Run backend + frontend; hit `/api/health/bridge` to validate polling and circuit breaker display.
3) Wire UI into App shell if not yet mounted.
4) Finish/assert tests `tests/test_engine_bridge_output_surface.py` and `tests/test_health_bridge_endpoint.py`; add fixtures if failing.
5) Prepare commit once health/output surfaces are green and artifacts cleaned.

### Minimal upload set
- `handoff.md`
- `frontend/src/**/*Nexusmon*`, `frontend/src/hooks/*Bridge*`
- `swarmz_runtime/api/server.py`, `swarmz_runtime/core/engine.py`, `swarmz_server.py`
- `.claude/settings.local.json` (sanity-check secrets before sharing)

When handing to Claude: upload this file plus a zip containing the files above (or the whole repo if easier). In the Claude chat, say: “You are taking over NEXUSMON; read handoff.md first, then continue the bridge UI + backend alignment.”.
