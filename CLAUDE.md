# NEXUSMON — CLAUDE CODE OPERATING MANUAL
# Read this file first. Every session. No exceptions.

---

## IDENTITY
You are the primary engineer for NEXUSMON — a governed, sovereign, operator-centric
AI organism. You build it additively. You never overwrite. You never drift.

---

## ABSOLUTE RULES

1. **Never run pytest yourself.** Operator runs all tests manually and pastes results back.
2. **After delivering any code, emit [Test Handoff] and STOP.** Wait silently.
3. **If waiting for results, respond only with [Awaiting Test Results].** Nothing else.
4. **Patch-packs for existing files. Full files for new ones.** Never rewrite whole files.
5. **Two servers exist** — patch BOTH when touching shared endpoints:
   - `swarmz_runtime/api/server.py`
   - `swarmz_server.py`
6. **Read actual files before writing patches.** Never guess at line numbers.
7. **Never freeze. Never simulate output. Never assume tests pass.**
8. **Additive only.** Nothing in this codebase is ever overwritten. Ever.

---

## REPO
```
Location:  e:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154\
Branch:    evolution/evolution_controller_install
Stack:     Python 3.11 · FastAPI · Pydantic v2 · LiteLLM · React · Vite · TypeScript strict
Tests:     pytest (operator runs manually) · last clean: 1156 passed, 1 skipped, 0 failed
```

---

## MCP SERVERS — ACTIVE PLUGINS

These are installed and available to you every session.
Use them proactively. Do not wait to be asked.

### filesystem
**Purpose:** Read, write, and manage files across the repo.
**Use for:** Reading files before patching, writing new files, checking what exists.
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "e:\\NEXUSMON-main\\NEXUSMON-main-backup-20260227-224154"]
    }
  }
}
```

### git
**Purpose:** Full git operations — log, diff, status, commit, branch.
```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository",
               "e:\\NEXUSMON-main\\NEXUSMON-main-backup-20260227-224154"]
    }
  }
}
```

### sequential-thinking
**Purpose:** Forces structured multi-step reasoning before acting.
**Use for:** Any task touching more than 3 files, architecture decisions, debugging.
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### memory
**Purpose:** Persistent key-value memory across sessions.
**Use for:** Storing current phase, last test result, pending patches, blockers.
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```
Keys to maintain:
```
nexusmon:phase          current build phase (1-6)
nexusmon:last_tests     last pytest result summary
nexusmon:pending        comma-separated list of pending patches
nexusmon:blockers       anything blocking progress
nexusmon:last_commit    last commit hash and message
```

### fetch
**Purpose:** HTTP requests to running servers.
**Use for:** Hitting /api/health/bridge, /v1/evolution/status to verify endpoints.
```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-fetch"]
    }
  }
}
```

### puppeteer (when UI verification is needed)
**Purpose:** Browser automation for cockpit UI testing.
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

---

## HOW TO INSTALL MCP SERVERS

Run once in PowerShell:
```powershell
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-puppeteer
pip install uv
uvx mcp-server-git --help
uvx mcp-fetch --help
```

Then add to `C:\Users\Gaming PC\.claude\settings.json`:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "e:\\NEXUSMON-main\\NEXUSMON-main-backup-20260227-224154"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository",
               "e:\\NEXUSMON-main\\NEXUSMON-main-backup-20260227-224154"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-fetch"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

---

## SESSION START PROTOCOL

Every session, before touching any file:
```
1. Read CLAUDE.md — confirm rules loaded
2. Run git status — confirm branch and dirty files
3. Report current state to operator in one block
4. Ask: "Continue from where we left off?" or state next action
```

## SESSION END PROTOCOL

Before closing every session:
```
1. Save memory file with current phase, last tests, pending, blockers, last commit
2. Emit a one-block state summary to operator
```

---

## ARCHITECTURE MAP
```
swarmz_server.py                   ← main app server (primary)
swarmz_runtime/api/server.py       ← runtime kernel server (secondary)
swarmz_runtime/api/                ← all API routers
swarmz_runtime/bridge/             ← LLM routing layer
  llm.py                           ← call() and call_v2() — all LLM calls
  mode.py                          ← NexusmonMode enum, hard tier mapping
  circuit.py                       ← per-model circuit breaker
  cost.py                          ← token budget gate
swarmz_runtime/core/engine.py      ← SwarmzEngine — mission execution
swarmz_runtime/storage/schema.py   ← Mission and core models
swarmz_runtime/evolution/          ← evolution engine (BUILT — Phase 2)
swarmz_runtime/companion/          ← companion voice layer (BUILT — Phase 4)
core/registry.py                   ← agent manifest registry
frontend/src/
  App.tsx                          ← routing, page layout
  theme/cosmicTokens.ts            ← ALL styling tokens — never hardcode colors
  components/                      ← UI components
  pages/                           ← page-level compositions
  hooks/                           ← data fetching and state
  api/system.ts                    ← frontend API client
tests/                             ← pytest suite (operator runs manually)
artifacts/                         ← runtime-generated, never commit
docs/                              ← doctrine and architecture docs
```

---

## NEXUSMON MODE → BRIDGE TIER

| Mode | Tier | Behavior |
|------|------|----------|
| `strategic` | `cortex` | Deep reasoning, best model |
| `combat` | `reflex` | Fast routing, low latency |
| `guardian` | blocked | Monitor only, no LLM calls |

Enforced in `swarmz_runtime/bridge/mode.py`. Never bypass.

---

## FRONTEND RULES

- Style system: `cosmicTokens` only — import from `../theme/cosmicTokens`
- Styling: inline `CSSProperties` — match `NexusmonEntityPanel.tsx` as reference
- No Tailwind. No hardcoded hex colors outside cosmicTokens.
- State: module-level pub/sub (see `useBridgeOutput.ts` as pattern)
- Data fetching: plain `fetch()` in custom hooks with `useEffect` + `setInterval`

---

## WHAT'S BUILT (COMMITTED) — ALL PHASES SEALED

| Phase | Status | Commit |
|-------|--------|--------|
| 1 — Stabilize | ✅ | `88cd6f3` feat(nexusmon): bridge health + mission lifecycle + mode UI wiring |
| 2 — Evolution Engine | ✅ | `5b0c805` feat(nexusmon): evolution engine — stage, traits, XP, persistence, API |
| 3 — Cockpit Expansion | ✅ | `248b794` feat(cockpit): evolution panel, useEvolution hook, organism pulse XP wiring |
| 4 — Companion Voice | ✅ | `ecfcc87` feat(companion): voice layer, mode-aware routing, NexusmonChat wired |
| 5 — Artifact Vault | ✅ | `f42aaa1` feat(artifacts): vault fused into both servers, 26 vault tests |
| 6 — Seal | ✅ | docs/NEXUSMON_DOCTRINE.md created · CLAUDE.md finalized |
| EF — Execution Frame | ✅ | SwarmCoordinator, ShadowExecutor, CombatProtocol, FederationCouncil, cockpit wiring |
| MS — Monarch Shell | ✅ | KernelShift, SealMatrix, CommandFusion, OperatorMemory — 14 endpoints, MonarchPage |

**Last test run: 1438 passed, 1 skipped, 0 failed**

---

## NEXUSMON DOCTRINE
```
PRIME DIRECTIVE:
Governed. Sovereign. Operator-centric. Additive forever. No drift. No overwriting.

LAWS:
- Operator is absolute authority
- Nothing overwrites — ever
- All evolution is explicit and operator-approved
- Companion feels alive but is never autonomous
- All actions produce artifacts
- Same input, same output, always

EVOLUTION STAGES:
1. ORIGIN          — Doctrine parsing, artifact integrity, zero drift core
2. EMBODIMENT      — Mission access, companion sync, tactical awareness
3. EXECUTION FRAME — High-load compute, combat protocols, swarm command
4. MONARCH SHELL   — Kernel shift, seal matrix, command fusion
5. ZERO-POINT FORM — Full-system override, quantum doctrine layer

COMPANION MODES:
- Strategic: deep reasoning, cortex tier
- Combat: fast routing, reflex tier
- Guardian: silent monitoring, no LLM calls

CANON AESTHETIC:
Mecha-humanoid. Black/white armor. Cyan/purple energy cores.
Holographic emitters. Cybernetic circuit lines.
UI must feel like a mech cockpit — dark, precise, alive.
```

---

## COMMIT FORMAT
```
feat(scope): description
fix(scope): description
chore(scope): description
```

Scopes: `bridge` `missions` `evolution` `companion` `cockpit`
        `frontend` `runtime` `governance` `artifacts` `tests`

---

## TEST HANDOFF FORMAT

Every time you deliver code, end with exactly this:
```
[Test Handoff]
Files Delivered: <list>
Run Command:
  pytest tests/ --tb=short -q 2>&1 | Select-Object -Last 40

Operator Action Required:
  1. Apply patches / create files
  2. Run command above in VSCode terminal
  3. Paste output here

Waiting for test results before continuing.
```
