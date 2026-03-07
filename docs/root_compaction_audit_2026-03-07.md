# Root Compaction Audit 2026-03-07

This audit reviews the first set of top-level folders most likely to be moved out of the repository root to make the GitHub view more compact.

The goal is not to move everything that looks old.

The goal is to separate:

- folders that only add visual noise
- folders that still have live code, CI, packaging, or release dependencies

---

## Audited Candidates

- `operator_console/`
- `operator_interface/`
- `mobile/`
- `apps/`
- `swarmz_app/`

---

## Outcome Summary

| Path | Status | Reason |
|------|--------|--------|
| `operator_console/` | moved | archived to `archive/operator/operator_console/` after audit confirmed no active imports |
| `operator_interface/` | blocked | imported by core runtime code |
| `mobile/` | blocked | referenced by release tooling and mobile packaging checks |
| `apps/` | blocked | `apps/gate-link` is referenced by CI and build workflows |
| `swarmz_app/` | blocked | referenced by runtime overlay and packaging include rules |

---

## Evidence

### `operator_console/`

Observed state:

- folder contains only `operator_console/__init__.py`
- file content is only a package scaffold docstring
- no `from operator_console` or `import operator_console` matches were found in the repo audit

Assessment:

- best candidate from this batch for relocation under an archive parent

Recommended destination:

- `archive/operator/operator_console/`

Current state:

- moved to `archive/operator/operator_console/`

### `operator_interface/`

Observed state:

- imported directly by core runtime code
- current evidence: `core/conversation_engine.py` imports `operator_interface.commands`

Assessment:

- do not move until runtime code is refactored away from the package or a compatibility shim is introduced

### `mobile/`

Observed state:

- referenced by `tools/release_gate.py`
- release gate expects `mobile/app_store_wrapper/...` files to exist at current paths

Assessment:

- not a safe compaction target yet

### `apps/`

Observed state:

- `.github/workflows/ci.yml` runs CI against `apps/gate-link`
- `MANIFEST.in` and `.dockerignore` also reference `apps/gate-link`

Assessment:

- cannot be moved without coordinated CI and packaging changes

### `swarmz_app/`

Observed state:

- `server_legacy_overlay.py` wires in `swarmz_app.api.hologram`
- `pyproject.toml` includes `swarmz_app*` in packaging include rules

Assessment:

- not safe to relocate in a cosmetic cleanup pass

---

## First Exact Move Recommendation

If the goal is to start cleaning the GitHub root with minimal break risk, the first move from this audit set should be:

1. move `operator_console/` to `archive/operator/operator_console/`  ✅
2. update any docs that mention it as a top-level surface  ✅
3. rerun tests and a startup smoke check

No other folder in this audit batch should be moved yet.

---

## What To Audit Next

The next likely compaction candidates should be checked with the same standard:

- `paste-agent/`
- `public/`
- `design/`
- `dev/`
- `galileo/`
- `matrix/`
- `forge/`

Some of these may still be active, but they are good next candidates because they contribute heavily to root sprawl.