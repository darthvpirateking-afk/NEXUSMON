# Branch Normalization Status

As of 2026-03-07, branch normalization is operationally complete.

## Completed

- Remote default branch changed to `main` on both `origin` and `sovereign`
- Local remote HEAD metadata updated to `main`
- Live policy/config files aligned to `main`:
  - `.github/workflows/ci.yml`
  - `README.md`
  - `docs/CONTRIBUTING.md`
  - `docs/ROADMAP.md`

## Current Policy

- `main` is the canonical development branch
- `master` remains as a legacy branch and is no longer the default
- `evolution/evolution_controller_install` remains unchanged

## Remaining Optional Cleanup

- Decide whether to freeze, fast-forward, or delete `master`
- Decide whether `sovereign` remains a long-term remote
- Optionally annotate historical status docs with a later-update note