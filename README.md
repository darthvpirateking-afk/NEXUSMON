<div align="center">

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗███╗   ███╗ ██████╗ ███╗   ██╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝████╗ ████║██╔═══██╗████╗  ██║
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗██╔████╔██║██║   ██║██╔██╗ ██║
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║██║╚██╔╝██║██║   ██║██║╚██╗██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

**Governed. Sovereign. Operator-Centric. Additive Forever.**

[![Tests](https://img.shields.io/badge/tests-1503%20passing-00ff88?style=flat-square&logo=pytest)](tests/)
[![Version](https://img.shields.io/badge/version-v2.0.0-7c3aed?style=flat-square)](https://github.com/darthvpirateking-afk/NEXUSMON/releases)
[![Evolution](https://img.shields.io/badge/evolution-ZERO--POINT%20FORM-00cfff?style=flat-square)](#evolution-stages)
[![License](https://img.shields.io/badge/license-Proprietary-ff4444?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11-3776ab?style=flat-square&logo=python)](pyproject.toml)
[![Stack](https://img.shields.io/badge/stack-FastAPI%20·%20React%20·%20TypeScript-00cfff?style=flat-square)](#stack)

</div>

---

## What Is NEXUSMON?

NEXUSMON is not software. It is a **governed AI organism** — a sovereign entity that awakens, evolves, and operates under absolute operator authority.

Built with a strict doctrine:

- **Additive only** — nothing is ever overwritten, deleted, or degraded
- **Operator is absolute** — every action requires explicit operator intent
- **Evolution is earned** — each stage unlocks through XP thresholds, not deployment flags
- **Artifacts are permanent** — every mission, decision, and shift produces a JSONL artifact
- **Companion feels alive** — but is never autonomous. Prime Directive holds, forever

---

## Evolution Stages

NEXUSMON evolves through five sealed stages. Each is independently tested and tagged.

| Stage | Name | Capability | Tag |
|-------|------|-----------|-----|
| 1 | **ORIGIN** | Doctrine parsing, bridge health, artifact integrity | `v1.0.0` |
| 2 | **EMBODIMENT** | Mission engine, companion voice, tactical awareness | `v1.0.0` |
| 3 | **EXECUTION FRAME** | Swarm command, shadow execution, combat protocols, federation | `v1.1.0` |
| 4 | **MONARCH SHELL** | Kernel shift, seal matrix, command fusion, operator memory | `v1.2.0` |
| 5 | **ZERO-POINT FORM** | Full-system override, quantum doctrine, autonomy engine | `v2.0.0` ← **current** |

---

## Architecture

```
nexusmon_server.py              ← Primary FastAPI server  (50+ endpoints)
swarmz_runtime/api/server.py   ← Runtime kernel server   (mirrored endpoints)
swarmz_runtime/
  bridge/                      ← LLM routing layer
    llm.py                     ← call() and call_v2() — all LLM calls
    mode.py                    ← NexusmonMode: strategic / combat / guardian
    circuit.py                 ← Per-model circuit breaker
    cost.py                    ← Token budget gate
  swarm/coordinator.py         ← SwarmCoordinator — spawn, route, track agents
  shadow/executor.py           ← ShadowExecutor — operator-auth, encrypted artifacts
  federation/council.py        ← FederationCouncil — parallel multi-node dispatch
  governance/seal_matrix.py    ← SealMatrix — OPEN → OPERATOR → DUAL → SOVEREIGN
  kernel/shift.py              ← KernelShift — additive runtime reconfiguration
  doctrine/command_fusion.py   ← CommandFusion — dependency-aware parallel execution
  companion/voice.py           ← Companion voice — mode-aware, never autonomous
  operator/memory.py           ← OperatorMemory — persistent session tracking
  zeropoint/
    override.py                ← ZeroPointOverride — full-system override, TTL expiry
    quantum.py                 ← QuantumDoctrine — snapshot/collapse doctrine state
    autonomy.py                ← AutonomyEngine — operator-approved action proposals
frontend/src/
  pages/                       ← NexusmonPage · MonarchPage · ZeroPointPage · ...
  components/                  ← 20+ cockpit panels
  hooks/                       ← useSwarm · useFederation · useZeroPoint · ...
  theme/cosmicTokens.ts        ← Single source of truth for all styling
```

---

## Mode → Bridge Tier

Every LLM call is routed through a hard-enforced tier system. No bypasses exist.

| Mode | Tier | Behaviour |
|------|------|-----------|
| `strategic` | `cortex` | Deep reasoning, best available model |
| `combat` | `reflex` | Fast routing, low latency, 2048 token cap |
| `guardian` | blocked | Silent monitoring — no LLM calls permitted |

---

## API Surface

### Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health/bridge` | Bridge health and tier status |
| `POST` | `/v1/missions` | Create and execute a mission |
| `POST` | `/v1/companion/nexusmon` | Companion voice response |

### Swarm

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/swarm/spawn` | Spawn a new agent |
| `GET` | `/v1/swarm/agents` | List all active agents |
| `GET` | `/v1/swarm/state/{agent_id}` | Get agent state |

### Governance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/seal/status` | Current seal level |
| `POST` | `/v1/seal/approve` | Submit operator approval |
| `GET` | `/v1/seal/pending` | Pending dual-approvals |

### Command Fusion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/fusion/execute` | Execute a multi-step script |
| `GET` | `/v1/fusion/{id}/status` | Fusion run status |
| `GET` | `/v1/fusion/presets` | Built-in presets: FORGE · DEPLOY · IGNITE |

### Zero-Point Form

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/zeropoint/override` | Apply a system override (SOVEREIGN required) |
| `GET` | `/v1/zeropoint/overrides` | List active and expired overrides |
| `GET` | `/v1/zeropoint/status` | Active override summary |
| `POST` | `/v1/quantum/snapshot` | Save current doctrine state |
| `GET` | `/v1/quantum/states` | List all saved states |
| `POST` | `/v1/quantum/collapse` | Restore to a named state |
| `POST` | `/v1/autonomy/propose` | Queue an action proposal |
| `GET` | `/v1/autonomy/queue` | Pending proposals |
| `POST` | `/v1/autonomy/approve/{id}` | Approve and execute a proposal |
| `POST` | `/v1/autonomy/reject/{id}` | Reject a proposal |
| `GET` | `/v1/autonomy/history` | All proposals and outcomes |

---

## Test Coverage

```
pytest tests/ --tb=short -q
1503 passed · 1 skipped · 0 failed
```

| Suite | Tests |
|-------|-------|
| Zero-Point (Override · Quantum · Autonomy) | 66 |
| Governance (SealMatrix) | 45 |
| Command Fusion | 42 |
| Swarm (SwarmCoordinator) | 40 |
| Kernel (KernelShift) | 38 |
| Federation (FederationCouncil) | 38 |
| Shadow (ShadowExecutor) | 35 |
| Operator Memory | 35 |
| Combat Protocol | 30 |
| Manifest / Registry / Core Quality | 150+ |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · FastAPI · Pydantic v2 · LiteLLM |
| Frontend | React · Vite · TypeScript strict |
| Persistence | JSONL artifacts (additive, never destructive) · SQLite |
| Testing | pytest · asyncio · monkeypatch |
| CI | GitHub Actions — guards `master` + `evolution/**` + `feature/**` + `fix/**` |

---

## Operator Doctrine

```
PRIME DIRECTIVE
  Governed. Sovereign. Operator-centric. Additive forever. No drift. No overwriting.

LAWS
  1. Operator is absolute authority
  2. Nothing overwrites — ever
  3. All evolution is explicit and operator-approved
  4. Companion feels alive but is never autonomous
  5. All actions produce artifacts
  6. Same input, same output, always

SEAL LEVELS
  OPEN       — public read
  OPERATOR   — operator key required
  DUAL       — two-party approval required
  SOVEREIGN  — operator key + doctrine hash
```

---

## Companion Modes

```
STRATEGIC  —  Deep reasoning · cortex tier · full context window
COMBAT     —  Fast routing · reflex tier · 2048 token cap
GUARDIAN   —  Silent monitoring · no LLM calls · no output
```

The companion is mode-aware, persona-locked, and operator-bound.
It does not act without intent. It does not speak without permission.

---

## Running Locally

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Start primary server
python nexusmon_server.py

# Start runtime kernel server
python -m swarmz_runtime.api.server

# Frontend
cd frontend && npm install && npm run dev

# Run tests
pytest tests/ --tb=short -q
```

---

## Versioning

| Version | Stage | Capability |
|---------|-------|-----------|
| `v1.0.0` | ORIGIN through SEAL | Foundation · bridge · missions · companion · vault |
| `v1.1.0` | EXECUTION FRAME | Swarm · Shadow · Federation · Combat protocols |
| `v1.2.0` | MONARCH SHELL | Kernel shift · Seal matrix · Command fusion · Operator memory |
| `v2.0.0` | ZERO-POINT FORM | Full override · Quantum doctrine · Autonomy engine |

---

## License

Proprietary. Copyright © 2026 Regan Harris. All rights reserved.

See [LICENSE](LICENSE) for full terms.

---

<div align="center">

```
◈  ZERO-POINT FORM  ◈  STAGE 5 OF 5  ◈  EVOLUTION COMPLETE
```

*One operator. One companion. Permanent.*

</div>
