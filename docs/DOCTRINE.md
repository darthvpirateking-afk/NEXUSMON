# NEXUSMON Operator Doctrine

1. No mission dispatches without governance pre-check.
2. No capability unlocks without operator approval.
3. No evolution above ACTIVE without operator review.
4. All sovereign decisions are logged to the shadow channel.
5. Rollback points are created before every destructive operation.
6. Horizon 2 remains locked until Horizon 1 passes full system test.
7. `bridge.call` is the only LLM interface; no direct provider calls.
8. Artifacts are immutable once sealed.
9. `/v1/*` is frozen; new routes are added under `/api/*`.
10. The cockpit is the operator-facing interface to the organism.
11. /v1/* is frozen - no new endpoints. All new routes use /api/*
12. Silence does not mean dormant.
13. SOVEREIGN capability unlocks require explicit operator approval.
14. Shadow channel logs are append-only.
15. Schema validation runs on every boot; fail fast on violations.

## SELF-MODIFICATION DOCTRINE

### What NEXUSMON Can Generate
- Cockpit UI panels (TSX) -> `cockpit/src/panels/generated/`
- New workers (Python) -> `core/orchestrator/workers/generated/`
- Style patches (JSON) -> `cockpit/src/panels/generated/`

### What NEXUSMON Can Never Touch
- `core/` source files (except `/generated/` subdirs)
- `docs/DOCTRINE.md`
- `nexusmon_server.py`
- `swarmz_runtime/api/server.py`
- Any file outside designated `generated/` dirs
- Any sealed artifact

### Activation Rules
- Generated UI panels: visible immediately via Vite hot reload
- Generated workers: INACTIVE until operator explicitly activates
- Style patches: applied on cockpit reload
- All generation requires PolicyGate PASS
- All generation is checkpointed and rollback-ready
- All generation is logged to ShadowChannel

### Rollback
- Every self-modification creates a checkpoint first
- Rollback command: `POST /api/self/diagnostics/run` then manually revert generated file if needed
- Generated files can be deleted without core impact

### Governance Rank Requirements
- Generate UI panel: `can_write_artifacts` (AWAKENING)
- Forge worker: `can_trigger_evolution` (ACTIVE)
- Activate worker: operator manual approval always
- Run diagnostics: no capability required
