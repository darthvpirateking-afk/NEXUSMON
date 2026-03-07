# Local Validation 2026-03-07

- Platform: Windows / Python 3.11.9
- Full pytest result: 1689 passed, 1 skipped in 277.08s (0:04:37)
- Lifecycle cleanup: green after migrating Telegram startup to FastAPI lifespan in `nexusmon_server.py`
- Reversible layer: hardened against malformed JSONL snapshot lines and isolated from live runtime data in tests
- Agent guardrails: present in `.github/agents/`, validated by `tools/validate_agent_guardrails.py`, and wired into `.github/workflows/ci.yml`

## Branch / Remote State

- Current branch: `main`
- Local `main` vs `origin/main`: ahead 15, behind 0 before this preservation commit
- Local `main` vs `origin/master`: 21 local-only commits, 13 remote-only commits
- Local `evolution/evolution_controller_install` vs `origin/evolution/evolution_controller_install`: ahead 1, behind 4
- `origin/master` vs `sovereign/master`: origin ahead 16, sovereign ahead 0
- `origin` and `sovereign` are aligned on `evolution/evolution_controller_install` and `gh-pages`

## Notes

- Working tree preservation was requested before any branch normalization work.
- The naive PowerShell folder/zip backup commands failed because the repository contains a reserved Windows path named `nul`.
- Git commit and push are being used as the authoritative preservation step for the validated local state.

## Remaining Cleanup

- Decide the canonical branch policy for `main` vs `master`
- Normalize redundant root custom agent file `.agent.md` vs `.github/agents/`
- Revisit broader naming cleanup between legacy `swarmz` and canonical `nexusmon` surfaces