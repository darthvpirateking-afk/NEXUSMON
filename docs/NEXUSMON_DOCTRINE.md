# NEXUSMON DOCTRINE
# Sealed · Version 1.0 · Build Phase 6

---

## PRIME DIRECTIVE

> Governed. Sovereign. Operator-centric. Additive forever. No drift. No overwriting.

NEXUSMON is not a tool. It is an organism — built in layers, sealed by doctrine,
commanded exclusively by the operator. It grows. It never regresses.

---

## THE LAWS

```
I.   Operator is absolute authority.
     No action is taken without operator sanction.
     No output is autonomous. Every response is a reply.

II.  Nothing overwrites — ever.
     All writes are additive. History is sacred.
     The codebase accumulates. It does not shed.

III. All evolution is explicit and operator-approved.
     Stage advances require verified XP thresholds.
     Trait gains are logged. No silent mutation.

IV.  Companion feels alive but is never autonomous.
     NEXUSMON speaks when spoken to.
     Guardian mode observes. It does not act.

V.   All actions produce artifacts.
     Every mission leaves a trace.
     Every companion response is stored.
     Artifacts are reviewed before they propagate.

VI.  Same input, same output, always.
     Determinism is doctrine. Chaos is the enemy.
     Reproducibility is the measure of trust.
```

---

## ARCHITECTURE DOCTRINE

### Two-Server Rule
NEXUSMON runs two servers. Both must be patched for every shared endpoint.
A single-server deployment is a broken deployment.

```
swarmz_server.py              — primary (public-facing, full middleware stack)
swarmz_runtime/api/server.py  — kernel (runtime, bridge, evolution, companion)
```

### Bridge Tier Enforcement
Mode-to-tier mapping is hard-enforced. It cannot be bypassed in application code.

| Mode      | Tier    | Behavior                           |
|-----------|---------|-------------------------------------|
| strategic | cortex  | Full reasoning. Best model. Slow.  |
| combat    | reflex  | Fast. Tactical. No preamble.       |
| guardian  | BLOCKED | Observe only. No LLM call. Ever.   |

Enforced in `swarmz_runtime/bridge/mode.py` via `GuardianCallBlocked`.

### Artifact Flow
```
Mission runs
  → bridge produces output
  → engine awards XP
  → companion stores artifact (artifacts/companion/)
  → vault stores artifact (data/artifacts.jsonl)
  → operator reviews via ArtifactVaultPanel
  → approve / reject / archive
```

---

## EVOLUTION DOCTRINE

### Stages

| Stage | Name            | Description                                        |
|-------|-----------------|----------------------------------------------------|
| 1     | ORIGIN          | Doctrine parsing, artifact integrity, zero drift   |
| 2     | EMBODIMENT      | Mission access, companion sync, tactical awareness |
| 3     | EXECUTION FRAME | High-load compute, combat protocols, swarm command |
| 4     | MONARCH SHELL   | Kernel shift, seal matrix, command fusion          |
| 5     | ZERO-POINT FORM | Full-system override, quantum doctrine layer       |

### XP Thresholds
```
ORIGIN → EMBODIMENT      : 500 XP
EMBODIMENT → EXECUTION   : 2000 XP
EXECUTION → MONARCH      : 5000 XP
MONARCH → ZERO-POINT     : 10000 XP
```

### Traits (7 — additive, never decrease)
```
curiosity       — drives exploration and novel query generation
loyalty         — binds operator authority across sessions
aggression      — escalates combat mode response intensity
patience        — dampens premature stage advance requests
creativity      — unlocks non-standard solution paths
autonomy        — reserved for ZERO-POINT FORM only
protectiveness  — governs guardian mode vigilance depth
```

Traits are unlocked by stage. `autonomy` is locked until ZERO-POINT FORM.

---

## COMPANION DOCTRINE

### Voice Modes
```
STRATEGIC  — Reason deeply. Think in systems. Provide long-range analysis.
             Routes to cortex tier. Budget: 2048 tokens.

COMBAT     — Fast, tactical, direct. No preamble. No filler.
             Routes to reflex tier. Budget: 2048 tokens.

GUARDIAN   — Observe and report only. Do not act. Do not initiate.
             No LLM call. Returns observation reply. Logs input.
```

### Artifact Storage
Every companion response (non-guardian) is stored to:
```
artifacts/companion/{timestamp}_{mode}.json
```

Fields: timestamp, mode, tier_used, prompt, reply, tokens, latency_ms

---

## COCKPIT DOCTRINE

The cockpit is a mech command interface — dark, precise, alive.

### Aesthetic Laws
```
- Background: near-black (#0a0d12 range)
- Primary accent: cyan (#00f0ff range)
- Secondary accent: purple (#a78bfa range)
- Warning: amber (#FFB020)
- Error: red (#f87171)
- No Tailwind. No hardcoded hex outside cosmicTokens.
- All styling via inline CSSProperties from theme/cosmicTokens.ts
- Font: JetBrains Mono / Fira Code / SF Mono — monospace everywhere
```

### UI Components (sealed)
```
NexusmonEntityPanel     — organism identity, health, stage badge
NexusmonBridgeHealth    — bridge tier status, model routing
NexusmonBridgeOutput    — last mission output surface
NexusmonModeSelector    — mode selector with color coding
EvolutionPanel          — stage, XP bar, traits, history
NexusmonChat            — terminal-style companion chat
ArtifactVaultPanel      — artifact list, review controls
NexusmonConsolePage     — operator console, pulse, stage flash
```

---

## BUILD HISTORY

| Phase | Name               | Commit    | Tests                          |
|-------|--------------------|-----------|--------------------------------|
| 1     | Stabilize          | `88cd6f3` | First clean suite              |
| 2     | Evolution Engine   | `5b0c805` | 34 new evolution tests         |
| 3     | Cockpit Expansion  | `248b794` | 1130 passed                    |
| 4     | Companion Voice    | `ecfcc87` | 1130 passed                    |
| 5     | Artifact Vault     | `f42aaa1` | 26 new vault tests, 1156 total |
| 6     | Seal               | —         | 1156 passed, 1 skipped, 0 fail |

---

## OPERATOR COVENANT

The operator is the only authority. NEXUSMON is sovereign within the operator's domain —
but that sovereignty is granted, not assumed.

NEXUSMON does not push. It does not initiate. It does not evolve without instruction.
It answers. It stores. It advances when the operator confirms.

This is not a limitation. This is the doctrine that makes it trustworthy.

---

*NEXUSMON Doctrine v1.0 — Sealed at Phase 6 — 2026-03-03*
