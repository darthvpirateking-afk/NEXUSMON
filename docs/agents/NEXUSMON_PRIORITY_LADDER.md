# NEXUSMON Master Roadmap & Priority Ladder

Sovereign AI Organism Platform · Game Universe · Governed Runtime  
2026 – 2028+ · Operator: Regan Harris · Classification: SOVEREIGN-INTERNAL

## Current Baseline State

| Metric | Value |
| --- | --- |
| Branch | `main` (clean, pushed) |
| Backend Tests | `1705 passed · 1 skipped · 0 failed · 4:58 runtime` |
| Frontend Vitest | `30 passed · 0 failed` |
| TypeScript Check | `tsc --noEmit CLEAN` |
| Vite Build | `CLEAN` |
| Commits Frozen | `7 commits locked into green baseline` |
| Sovereign Seal | `✦✸⚚⬡◎⟐ active` |
| Dirty Files Cleared | `registry.json · proposal.json · test_supply_network_route.py → dropped` |

## Core Architectural Invariants

These rules are non-negotiable at every phase. Violation blocks promotion to the next gate.

| Invariant | Rule |
| --- | --- |
| Additive-only evolution | Core runtime never mutates. Only additive layering permitted. |
| Manifest as truth | Manifest is the single source of truth for all agent/worker state. |
| Least-privilege spawn | All spawn contexts enforce minimum required permissions. |
| Deterministic routing | Routing is deterministic. Weights are operator-configurable only. |
| 8-stage gate pipeline | Evolution requires all 8 operator-gated stages to complete in order. |
| Operator sovereignty | No action executes without operator consent in governed contexts. |
| Audit append-only | ShadowChannel JSONL is append-only. No retroactive edits. |
| Sovereign Seal | `✦✸⚚⬡◎⟐` appears on all canonical outputs. |

## The Priority Ladder — Canonical Execution Order

This is the exact sequence that gets NEXUSMON from governed shell to sovereign platform. Each rung unlocks the next. Do not skip.

| # | Priority | Outcome | Horizon |
| --- | --- | --- | --- |
| 01 | Cockpit truth wiring | All panels expose real backend data — no flat-row hiding | NOW |
| 02 | Real mission execution truth | Execution spine: queued → admitted → executing → completed/failed | NOW |
| 03 | Bond + Supply panel audit | Hooks verified truthful, same fix as artifact inspector | NOW |
| 04 | Presence panel wiring | NexusmonPresencePanel + useBondStatus validated | NOW |
| 05 | Artifact inspector test | Component-level coverage locks new inspector behavior | NOW |
| 06 | Vite proxy + asset verification | Environment correctness before further cockpit work | NOW |
| 07 | Root compaction final pass | design/ folder cleared, repo layout canonical | NOW |
| 08 | Backend-driven avatar/presence | Avatar reflects runtime truth not local animation state | NEAR |
| 09 | Operator session + auth context | Real operator identity replaces all placeholder params | NEAR |
| 10 | Observability / control plane | Runtime health, queue depth, provider state visible to operator | NEAR |
| 11 | PolicyGate | PASS / ESCALATE / QUARANTINE / DENY governance outcomes live | NEAR |
| 12 | OrchestratorEngine | Deterministic routing with operator-configurable weights | NEAR |
| 13 | RollbackEngine | Checkpoint files + audit trail operational | NEAR |
| 14 | ShadowChannel hardening | Append-only JSONL + SSE broadcast confirmed stable | NEAR |
| 15 | EvolutionEngine | XP / rank / capability unlock wired to hardening score thresholds | NEAR |
| 16 | Governed artifact lifecycle | draft → generated → reviewed → sealed → transmitted → archived | NEAR |
| 17 | Companion core workbench | Typed composer modes, persistent drafts, mission/artifact context | NEAR |
| 18 | Full awakening test script | Operator-gated boot sequence end-to-end validation | NEAR |
| 19 | Repo consolidation | Single canonical structure, all slices verified in sync | H1 |
| 20 | Worker form validation | BYTEWOLF / GLITCHRA / SIGILDRON each have exercised test paths | H1 |
| 21 | Mirrored server audit | nexusmon_server.py and server.py confirmed in sync on all endpoints | H1 |
| 22 | Dream Seeds | Creation → incubation → artifact mutation → mission template generation | H1 |
| 23 | Memory Palace | Node graph, artifact provenance links, replay viewer, lore fragments | H1 |
| 24 | Budget / supply governance | Provider policy, budget guardrails, cost-aware routing decisions | H1 |
| 25 | Telegram operator control | Phone-based operator control with new token | H1 |
| 26 | Deployment / packaging hardening | Canonical env matrix, startup modes explicit, no hidden footguns | H1 |
| 27 | Mission / artifact / companion unification | Three rails become one governed organism with shared context IDs | H1 |
| 28 | Audit ledger / event history | Append-only event model, export/replay capability | H1 |
| 29 | Cockpit polish — operator console | Layout, density, hierarchy pass — command deck not React page | H1 |
| 30 | Agent Factory | Manifest editor, guardrail validator, spawn/revoke, team composition | H2 |
| 31 | Agent Sandbox | Deterministic simulation, tool contracts, I/O caps, risk scoring | H2 |
| 32 | Agent evolution + chip system | Trait mutations, chip skills, blueprint crafting | H2 |
| 33 | AGI Orchestrator (bounded) | Mission DAG synthesis, ranked plan proposals — proposes, never acts | H2 |
| 34 | AGI Safety layer | Sandbox chain-of-thought, signed proposals, hallucination scoring, drift detection | H2 |
| 35 | AGI Console | Proposal viewer, risk summary, operator approval flow, reasoning replay | H2 |
| 36 | Ecosystem / SDK / external control | Stable external API, SDK surface, worker/plugin registration | H2 |
| 37 | Agent Arena — core | 6×6 grid combat, real-time + tactical pause, skill chips, virus encounters | H3 |
| 38 | Agent Arena — PvP/PvE | Solo runs, ranked PvP, co-op raids, seasonal events | H3 |
| 39 | Agent Arena — rewards | Signed artifact drops, Dream Seed drops, blueprint drops, form unlocks | H3 |
| 40 | NEXUSMON World RPG | Open-world layer: real-world nodes as dungeons, virus outbreaks, factions | H3 |
| 41 | World campaign + story | Operator storyline, virus lords, rogue agents, Dream Seed arcs | H3 |
| 42 | Federation — node identity | DID/X.509, operator attestation, node registry | H4 |
| 43 | Federation — handoff | Escrow, commit/rollback, cross-node policy negotiation, signed receipts | H4 |
| 44 | Federation — map surface | Node topology, handoff queue, cross-node missions, federation events | H4 |
| 45 | Economy + marketplace | Agent blueprints, Dream Seeds, mission templates, chip packs, cosmetics | H4 |
| 46 | Operator certification | Training missions, exams, badges, leaderboards | H4 |
| 47 | Enterprise SaaS | On-prem, SOC2/HIPAA, audit export, SSO+RBAC, multi-operator orgs | H5 |

## Horizon Detail

### NOW — Active Sprint (Current)

Clean tree, 7 commits frozen, all gates green. These items are unblocked today.

#### 01–07 Cockpit Truth + Execution Foundation — Active Sprint

| Item | Description | Status |
| --- | --- | --- |
| Cockpit truth wiring | All panels expose real backend data — no placeholder state | IN FLIGHT |
| Mission execution truth | Real execution spine: queued → admitted → executing → terminal states | NEXT UP |
| Bond/Supply panel audit | Verify hooks match artifact inspector pattern — no hidden metadata | NEXT UP |
| Presence panel wiring | NexusmonPresencePanel.tsx + useBondStatus.ts validated against backend | QUEUED |
| Artifact inspector test | Targeted component coverage locks new inspector behavior | QUEUED |
| Vite proxy verification | Proxy vs backend-served asset correctness confirmed | QUEUED |
| Root compaction | design/ folder final pass, repo layout canonical | QUEUED |

### NEAR — Runtime Hardening + Operator-Grade Product (Next Gate)

Once sprint items pass regression gate. Priorities 08–29.

#### 08–18 Runtime Hardening Horizon — Weeks 2–8

| Item | Description | Status |
| --- | --- | --- |
| Avatar/presence state | Backend-driven — runtime truth replaces local animation state | LOCKED |
| Operator session/auth | Real operator identity replaces all hardcoded placeholders | LOCKED |
| Observability panel | Runtime health, queue depth, provider state — operator console view | LOCKED |
| PolicyGate | PASS / ESCALATE / QUARANTINE / DENY outcomes — governance core | LOCKED |
| OrchestratorEngine | Deterministic routing, operator-configurable weights | LOCKED |
| RollbackEngine | Checkpoint files, audit trail, reversible snapshot hardening | LOCKED |
| ShadowChannel hardening | Append-only JSONL + SSE broadcast — forensic mode included | LOCKED |
| EvolutionEngine | XP → rank → capability unlock, hardening score gate | LOCKED |
| Governed artifact lifecycle | Full state machine: draft → sealed → transmitted → archived | LOCKED |
| Companion workbench | Typed composer modes, persistent drafts, mission/artifact context | LOCKED |
| Awakening test script | Operator-gated boot sequence end-to-end | LOCKED |

#### 19–29 Operator-Grade Product Horizon — Weeks 8–20

| Item | Description | Status |
| --- | --- | --- |
| Repo consolidation | Single canonical layout, all slices in sync | GATE-LOCKED |
| Worker form validation | BYTEWOLF / GLITCHRA / SIGILDRON exercised test paths | GATE-LOCKED |
| Mirrored server audit | nexusmon_server.py ↔ server.py endpoint parity confirmed | GATE-LOCKED |
| Dream Seeds | Incubation → artifact mutation → mission template generation | GATE-LOCKED |
| Memory Palace | Node graph, provenance links, replay viewer, lore fragments | GATE-LOCKED |
| Budget/supply governance | Provider policy, budget guardrails, cost-aware routing | GATE-LOCKED |
| Telegram control | Phone-based operator control, new validated token | GATE-LOCKED |
| Deployment hardening | Canonical env matrix, explicit startup modes, no footguns | GATE-LOCKED |
| Rail unification | Mission + artifact + companion = one organism with shared context IDs | GATE-LOCKED |
| Audit ledger | Append-only event model, export/replay capability | GATE-LOCKED |
| Cockpit polish | Layout, density, hierarchy pass — command deck not React page | GATE-LOCKED |

### H2 — Agent Ecosystem (Weeks 20–40)

Gate condition: H1 fully consolidated, hardening score threshold met, operator explicit unlock.

#### 30–36 Agent Factory + AGI Layer — Weeks 20–40

| Item | Description | Status |
| --- | --- | --- |
| Agent Factory | Manifest editor, guardrail validator (CI + runtime), spawn/revoke | H1-GATED |
| Agent Sandbox | Deterministic simulation, tool contracts, I/O caps, risk scoring | H1-GATED |
| Agent evolution | Trait mutations, chip skills, blueprint crafting | H1-GATED |
| AGI Orchestrator | Mission DAG synthesis, ranked proposals — proposes, never acts alone | H1-GATED |
| AGI Safety layer | Signed proposals, hallucination scoring, drift detection, sandbox CoT | H1-GATED |
| AGI Console | Proposal viewer, risk summary, operator approval, reasoning replay | H1-GATED |
| Ecosystem / SDK | Stable external API contract, worker/plugin onboarding pattern | H1-GATED |

### H3 — Game Universe (Weeks 40–80)

Gate condition: H2 agent layer stable, operator explicit unlock. The MegaMan BN × Digimon × LoL dream.

#### 37–41 Agent Arena + NEXUSMON World RPG — Weeks 40–80

| Item | Description | Status |
| --- | --- | --- |
| Arena core | 6×6 grid, real-time + tactical pause, skill chips, virus encounters | H2-GATED |
| Arena PvP / PvE | Solo runs, ranked PvP, co-op raids, seasonal events | H2-GATED |
| Arena rewards | Signed artifacts, Dream Seed drops, blueprint drops, form unlocks | H2-GATED |
| World RPG | Real-world nodes as dungeons, virus outbreaks, provider faction control | H2-GATED |
| Campaign + story | Operator arc, virus lords, rogue agents, Dream Seed mysteries | H2-GATED |

### H4–H5 — Federation + Platform Economy (Weeks 60–120)

Gate condition: H3 stable or operator directive. Multi-node, cross-operator, commercial layer.

#### 42–47 Federation Mesh + Enterprise SaaS — Weeks 60–120

| Item | Description | Status |
| --- | --- | --- |
| Node identity | DID/X.509, operator attestation, node registry | H3-GATED |
| Federation handoff | Escrow, commit/rollback, cross-node policy, signed receipts | H3-GATED |
| Federation map | Node topology, handoff queue, cross-node missions, federation events | H3-GATED |
| Economy + marketplace | Agent blueprints, Dream Seeds, chip packs, cosmetic forms | H3-GATED |
| Operator certification | Training missions, exams, badges, leaderboards | H3-GATED |
| Enterprise SaaS | On-prem, SOC2/HIPAA, audit export, SSO+RBAC, multi-operator orgs | H4-GATED |

## Canonical Worker Forms

| Form | Role | Specialization | Validation Status |
| --- | --- | --- | --- |
| BYTEWOLF | Pathfinder / Analysis | Exploration, pattern recognition, audit trail generation | Needs exercised test path |
| GLITCHRA | Anomaly / Transform | Edge case handling, mutation, signal processing | Needs exercised test path |
| SIGILDRON | Artifact Courier | Sealed delivery, provenance tracking, transmission verification | Needs exercised test path |

## Gate Conditions — Horizon Unlock Criteria

| Horizon | Unlock Criteria |
| --- | --- |
| NOW → NEAR | Full regression gate clean (`pytest 1705+`, `vitest 30+`, `tsc clean`, `vite build clean`) after each sprint slice. No skipped gates. |
| NEAR → H1 | Runtime hardening horizon complete. All 11 near-term priorities verified. New green checkpoint cut with exact totals. |
| H1 → H2 | H1 fully consolidated. Hardening score threshold met. Operator explicit unlock directive issued. Mirrored server parity confirmed. |
| H2 → H3 | Agent Factory stable. AGI Safety layer reviewed and signed by operator. No open governance violations. |
| H3 → H4 | Game universe MVP operational. Operator explicit directive. No pending H3 stability blockers. |
| H4 → H5 | Federation mesh tested across at least 2 nodes. Economy layer operational. Enterprise pilot scoped. |

## Regression Gate — Mandatory After Every Slice

Run these in order. All must pass before cutting a checkpoint or promoting to the next priority.

| # | Command | Pass Condition | Surface |
| --- | --- | --- | --- |
| 1 | `pytest --tb=short -q` | `1705+ passed, 0 failed` | Backend |
| 2 | `npx vitest run` | `30+ passed, 0 failed` | Frontend |
| 3 | `npx tsc --noEmit` | Zero errors | Frontend |
| 4 | `npx vite build` | Clean build, no warnings | Frontend |
| 5 | Update checkpoint doc | Exact totals, commands, timestamp recorded | Repo |

✦✸⚚⬡◎⟐

NEXUSMON · SOVEREIGN AI ORGANISM · OPERATOR: REGAN HARRIS

This document is the canonical master roadmap. All prior versions superseded.