# Root Compaction Audit Batch 2 2026-03-07

This audit reviews the second group of top-level folders that contribute heavily to the crowded GitHub root.

---

## Audited Candidates

- `paste-agent/`
- `public/`
- `design/`
- `dev/`
- `galileo/`
- `matrix/`
- `forge/`

---

## Outcome Summary

| Path | Status | Reason |
|------|--------|--------|
| `paste-agent/` | moved | archived to `archive/tools/paste-agent/` after audit confirmed no active imports or references |
| `public/` | moved | archived to `archive/static/public/` after audit confirmed no active code references |
| `design/` | likely movable | appears to be design canon and token assets, with no active code imports found |
| `dev/` | moved | archived to `archive/dev/demo_scripts/` after audit confirmed it was demo-only helper content |
| `galileo/` | blocked | imported by backend and runtime route layers |
| `matrix/` | blocked | imported by multiple compatibility shims and tied to tested runtime surfaces |
| `forge/` | moved | archived to `archive/tools/forge/` after audit confirmed it was standalone script content |

---

## Evidence

### `paste-agent/`

Observed state:

- folder contains `examples/`, `paste_agent/`, and `tests/`
- no active references to `paste-agent` or `paste_agent` were found in the repo audit

Assessment:

- strong candidate for relocation under an archive or tools-oriented parent

Current state:

- moved to `archive/tools/paste-agent/`

### `public/`

Observed state:

- root `public/` currently contains `plugins/`
- no active code references to root `public/` or `public/plugins` were found in the audit set

Assessment:

- likely safe to relocate, but worth a final frontend/static asset audit before moving

Current state:

- moved to `archive/static/public/`

### `design/`

Observed state:

- contains style canon, moodboard, and token files
- no active code imports of `design` were found
- references are documentation-oriented and branding-oriented

Assessment:

- likely movable under `docs/` or `archive/design/` depending whether you want it treated as active design system reference or archived canon

### `dev/`

Observed state:

- contains explicit demo/helper scripts
- `dev/infra_simulation_demo.py` states that it is dev-only and optional
- no active code imports of `dev` were found

Assessment:

- good compaction candidate

Current state:

- moved to `archive/dev/demo_scripts/`

### `galileo/`

Observed state:

- imported by `nexusmon_server.py`
- imported by `swarmz_runtime/api/galileo_routes.py`
- imported by `swarmz_runtime/api/galileo_storage_shim.py`

Assessment:

- live backend surface; do not move in a cosmetic cleanup pass

### `matrix/`

Observed state:

- many root compatibility shims import from `matrix.core`
- related routes are exercised by tests

Assessment:

- not safe to relocate without a broader compatibility migration

### `forge/`

Observed state:

- contains `sensor_monitor_v1.py`
- file appears to be lightweight standalone script content
- no active code imports of `forge` were found in the repo audit

Assessment:

- likely movable, but do a quick script-entrypoint audit before any physical move

Current state:

- moved to `archive/tools/forge/`

---

## Exact Candidate Set After Batch 2

Best current candidates for a low-risk root compaction branch:

- `design/`

Current blocked set:

- `operator_interface/`
- `mobile/`
- `apps/`
- `swarmz_app/`
- `galileo/`
- `matrix/`

---

## Recommended Next Action

Before any actual folder moves:

1. decide the destination structure for likely-movable folders
2. do one final reference sweep for static asset or script-entrypoint assumptions
3. move only one or two low-risk folders first
4. rerun tests and startup smoke checks

Completed first physical moves:

- `operator_console/` -> `archive/operator/operator_console/`
- `dev/` -> `archive/dev/demo_scripts/`
- `paste-agent/` -> `archive/tools/paste-agent/`
- `public/` -> `archive/static/public/`
- `forge/` -> `archive/tools/forge/`

If the goal is continued visual cleanup with minimal risk, `design/` is now the clearest next cosmetic compaction candidate.