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
[![Evolution](https://img.shields.io/badge/evolution-ZERO--POINT%20FORM-00cfff?style=flat-square)](#evolution-progress)
[![License](https://img.shields.io/badge/license-Proprietary-ff4444?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11-3776ab?style=flat-square&logo=python)](pyproject.toml)
[![Stack](https://img.shields.io/badge/stack-FastAPI%20·%20React%20·%20TypeScript-00cfff?style=flat-square)](#tech-stack)

</div>

---

## Executive Summary

NEXUSMON is a **governed, operator-centric AI orchestration platform** built on a strict additive doctrine: nothing is ever overwritten, deleted, or degraded. Every action is operator-authorized, every decision produces a permanent JSONL artifact, and every LLM call is routed through a hard-enforced tier system.

The platform has reached **Zero-Point Form** — its fifth and final evolution stage — delivering full-system override capabilities, quantum doctrine snapshots, and operator-approved autonomy proposals on top of a battle-tested swarm, governance, and command-fusion stack.

---

## Core Modules

<table>
<tr>
<td width="33%" valign="top">

### 🔀 Swarm Engine
Spawn, route, and track parallel agents across distributed compute nodes via `SwarmCoordinator`. Supports federation dispatch across multi-node clusters through `FederationCouncil`.

</td>
<td width="33%" valign="top">

### 🛡️ Governance Layer
Four-level seal system (`OPEN → OPERATOR → DUAL → SOVEREIGN`) enforced by `SealMatrix`. Every privileged action requires explicit operator authorization.

</td>
<td width="33%" valign="top">

### ⚡ Command Fusion
`CommandFusion` executes dependency-aware, parallel multi-step scripts. Built-in presets: **FORGE**, **DEPLOY**, **IGNITE**. Full run history and status tracking.

</td>
</tr>
<tr>
<td width="33%" valign="top">

### 🌐 LLM Bridge
Mode-aware routing through `cortex` (deep reasoning) and `reflex` (low-latency) tiers. Per-model circuit breakers and token budget gates prevent runaway spend.

</td>
<td width="33%" valign="top">

### 🧠 Companion Voice
Mode-locked companion interface: **Strategic** (full context), **Combat** (2048-token cap), **Guardian** (silent monitoring). Never autonomous — operator-bound by design.

</td>
<td width="33%" valign="top">

### ✴️ Zero-Point Form
Full-system overrides with TTL expiry, quantum doctrine snapshots, and operator-approved autonomy proposals. Requires `SOVEREIGN` seal level. Stage 5 of 5.

</td>
</tr>
</table>

---

## System Architecture

<table>
<tr>
<td width="50%" valign="top">

**Backend**
```
nexusmon_server.py              ← Primary FastAPI server (50+ endpoints)
swarmz_runtime/api/server.py   ← Runtime kernel server  (mirrored endpoints)
swarmz_runtime/
  bridge/llm.py                ← All LLM calls: call() / call_v2()
  bridge/mode.py               ← NexusmonMode enum + tier mapping
  bridge/circuit.py            ← Per-model circuit breaker
  bridge/cost.py               ← Token budget gate
  swarm/coordinator.py         ← SwarmCoordinator
  shadow/executor.py           ← ShadowExecutor (encrypted artifacts)
  federation/council.py        ← FederationCouncil
  governance/seal_matrix.py    ← SealMatrix (4 seal levels)
  kernel/shift.py              ← KernelShift (additive reconfiguration)
  doctrine/command_fusion.py   ← CommandFusion
  companion/voice.py           ← Companion voice layer
  operator/memory.py           ← OperatorMemory
  zeropoint/override.py        ← ZeroPointOverride
  zeropoint/quantum.py         ← QuantumDoctrine
  zeropoint/autonomy.py        ← AutonomyEngine
```

</td>
<td width="50%" valign="top">

**Frontend**
```
frontend/src/
  pages/
    NexusmonPage.tsx           ← Main cockpit dashboard
    MonarchPage.tsx            ← Monarch Shell controls
    ZeroPointPage.tsx          ← Zero-Point Form interface
    CosmicPage.tsx             ← Artifact intelligence
  components/                  ← 20+ cockpit panels
  hooks/
    useSwarm.ts                ← Swarm state + actions
    useFederation.ts           ← Federation dispatch
    useZeroPoint.ts            ← Override / quantum / autonomy
    useEvolution.ts            ← XP and stage tracking
  theme/cosmicTokens.ts        ← Single source of truth for styling
  api/system.ts                ← Frontend API client
```

**Persistence**
```
artifacts/                     ← Runtime JSONL artifacts (never deleted)
data/                          ← Missions, activity, operator state
```

</td>
</tr>
</table>

---

## Evolution Progress

| Stage | Name | Capability | Version |
|------:|------|-----------|:-------:|
| 1 | **ORIGIN** | Doctrine parsing · bridge health · artifact integrity | `v1.0.0` |
| 2 | **EMBODIMENT** | Mission engine · companion voice · tactical awareness | `v1.0.0` |
| 3 | **EXECUTION FRAME** | Swarm command · shadow execution · combat protocols · federation | `v1.1.0` |
| 4 | **MONARCH SHELL** | Kernel shift · seal matrix · command fusion · operator memory | `v1.2.0` |
| **5** | **ZERO-POINT FORM** | Full-system override · quantum doctrine · autonomy engine | **`v2.0.0`** ✦ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · FastAPI · Pydantic v2 · LiteLLM |
| Frontend | React · Vite · TypeScript (strict) |
| Persistence | JSONL artifacts (additive, never destructive) · SQLite |
| Testing | pytest · asyncio · monkeypatch — 1503 passing |
| CI | GitHub Actions — guards `master` + `evolution/**` + `feature/**` + `fix/**` |

---

## API Reference

<details>
<summary><strong>Core Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health/bridge` | Bridge health and tier status |
| `POST` | `/v1/missions` | Create and execute a mission |
| `POST` | `/v1/companion/nexusmon` | Companion voice response |

</details>

<details>
<summary><strong>Swarm</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/swarm/spawn` | Spawn a new agent |
| `GET` | `/v1/swarm/agents` | List all active agents |
| `GET` | `/v1/swarm/state/{agent_id}` | Get agent state |

</details>

<details>
<summary><strong>Governance</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/seal/status` | Current seal level |
| `POST` | `/v1/seal/approve` | Submit operator approval |
| `GET` | `/v1/seal/pending` | Pending dual-approvals |

</details>

<details>
<summary><strong>Command Fusion</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/fusion/execute` | Execute a multi-step script |
| `GET` | `/v1/fusion/{id}/status` | Fusion run status |
| `GET` | `/v1/fusion/presets` | Built-in presets: FORGE · DEPLOY · IGNITE |

</details>

<details>
<summary><strong>Zero-Point Form</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/zeropoint/override` | Apply a system override (`SOVEREIGN` required) |
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

</details>

---

## Local Development

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Start the primary server
python nexusmon_server.py

# Start the runtime kernel server
python -m swarmz_runtime.api.server

# Start the frontend (React + Vite)
cd frontend && npm install && npm run dev

# Run the full test suite
pytest tests/ --tb=short -q
```

---

## Governance Doctrine

```
PRIME DIRECTIVE
  Governed. Sovereign. Operator-centric. Additive forever. No drift. No overwriting.

OPERATOR LAWS
  1. Operator is absolute authority
  2. Nothing overwrites — ever
  3. All evolution is explicit and operator-approved
  4. Companion is mode-locked and never autonomous
  5. All actions produce permanent artifacts
  6. Same input, same output, always

SEAL LEVELS
  OPEN       — public read access
  OPERATOR   — operator key required
  DUAL       — two-party approval required
  SOVEREIGN  — operator key + doctrine hash verification
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting issues, proposing changes, and the pull request process.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

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
