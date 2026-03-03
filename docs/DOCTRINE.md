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
