# Root Compaction Plan 2026-03-07

This document describes how to make the GitHub repository root look substantially cleaner without doing a risky blind mass-move.

---

## Constraint

GitHub does not provide a repository setting to visually collapse or compact the root tree.

If the top of the repo looks crowded, the only real fix is to reduce how many files and folders live at the top level.

---

## Goal

Reduce the visible root surface to something closer to:

- `frontend/`
- `swarmz_runtime/`
- `core/`
- `tests/`
- `docs/`
- `tools/`
- `schemas/`
- `config/`
- `.github/`
- a small set of intentional root entry files

That would make GitHub navigation feel much tighter and would push historical or secondary material behind clearer grouping.

---

## What Should Stay At Root

These are the most defensible top-level surfaces to keep visible:

- `README.md`
- `LICENSE`
- `pyproject.toml`
- `package.json`
- `requirements.txt`
- `requirements-dev.txt`
- `nexusmon_server.py`
- `frontend/`
- `swarmz_runtime/`
- `core/`
- `tests/`
- `docs/`
- `tools/`
- `schemas/`
- `config/`
- `.github/`

Everything else should justify its place or move behind a clearer parent.

---

## Highest-Value Compaction Targets

These top-level directories make the root feel noisy because they read as parallel product surfaces, experiments, or historical layers:

- `apps/`
- `backend/`
- `bootstrap/`
- `cockpit/`
- `control_plane/`
- `design/`
- `dev/`
- `evolution/`
- `forge/`
- `galileo/`
- `kernel_runtime/`
- `matrix/`
- `mobile/`
- `operator_console/`
- `operator_interface/`
- `paste-agent/`
- `public/`
- `runtime/`
- `src/`
- `swarmz/`
- `swarmz_app/`
- `system/`
- `theorem_kb/`

Not all of these are safe to move immediately. Some may still be referenced by scripts, imports, packaging, or deployment config.

---

## Safe Strategy

### Phase 1: classify only

- confirm which folders are active
- confirm which folders are historical
- confirm which folders are generated or runtime-only
- do not move anything yet

### Phase 2: move archival surfaces first

Preferred grouping:

- `archive/ui/` for superseded UI surfaces
- `archive/runtime/` for preserved older runtime layers
- `archive/experiments/` for prototypes and one-off systems
- `archive/operator/` for alternative operator shells
- `archive/dev/` for optional demo and simulation helpers
- `archive/tools/` for isolated tool or sandbox surfaces
- `archive/static/` for root-level static payloads that are not active entry points

Best early candidates, pending reference audit:

- `operator_console/`
- `operator_interface/`
- `swarmz_app/`
- `apps/`
- `mobile/`

Initial completed moves:

- `operator_console/` -> `archive/operator/operator_console/`
- `dev/` -> `archive/dev/demo_scripts/`
- `paste-agent/` -> `archive/tools/paste-agent/`
- `public/` -> `archive/static/public/`
- `forge/` -> `archive/tools/forge/`

### Phase 3: consolidate secondary product surfaces

Candidate decisions:

- either keep `cockpit/` as explicitly supported legacy UI
- or move it under `archive/ui/cockpit/` if it is no longer operationally needed

### Phase 4: collapse root-only scripts and docs

Move stray operational scripts and historical one-off files into:

- `scripts/`
- `docs/archive/root-docs/`
- `docs/status/`

This does not solve the folder problem by itself, but it reduces the visual noise materially.

---

## What Not To Move Blindly

Do not relocate these without a direct reference audit:

- `frontend/`
- `swarmz_runtime/`
- `core/`
- `tests/`
- `tools/`
- `schemas/`
- `config/`
- `nexusmon_server.py`
- any folder referenced by packaging, Docker, CI, or import paths

---

## Recommended First Real Cleanup Branch

If you want the GitHub root to look cleaner without gambling on the runtime, the first dedicated structural branch should do only this:

1. audit top-level references for `operator_console/`, `operator_interface/`, `mobile/`, `apps/`, and `swarmz_app/`
2. move only folders with zero active runtime references into `archive/`
3. update broken doc links
4. rerun tests and startup checks

That single pass would likely make the repository root look noticeably more intentional.

---

## Practical Answer

Yes, the top of the GitHub repo can be made much more compact.

But it cannot be done with a GitHub toggle.

It requires a deliberate root normalization pass, and the safe version is:

- archive clearly non-active top-level folders
- consolidate secondary surfaces
- keep only the real active entry points visible at root

That is the path that improves appearance without creating hidden breakage.

First audited results are recorded in [docs/root_compaction_audit_2026-03-07.md](docs/root_compaction_audit_2026-03-07.md).

Second-batch results are recorded in [docs/root_compaction_audit_batch2_2026-03-07.md](docs/root_compaction_audit_batch2_2026-03-07.md).