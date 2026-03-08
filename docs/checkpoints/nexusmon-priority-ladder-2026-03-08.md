# NEXUSMON Priority Ladder

Date: 2026-03-08

Purpose: define the next execution order from the clean main baseline without starting new product work in this checkpoint.

## Baseline

- Current branch state is clean and pushed.
- Verified baseline remains documented in `docs/checkpoints/nexusmon-green-baseline.md`.
- The next version target is still v2.2.0: Deployment + Mobile, but part of that surface already exists in code and tests.

## What Already Exists

- `nexusmon_server.py` already exposes `/v1/deployment/mobile-status`.
- `swarmz_runtime/api/deployment_mobile_status.py` already provides deterministic deployment/mobile readiness payloads.
- `tests/test_deployment_mobile_status.py` and `tests/test_deployment_mobile_status_endpoints.py` already cover helper and endpoint behavior.
- `mobile/app_store_wrapper/` already exists as a packaging surface.

This means v2.2.0 should start by making existing deployment/mobile truth visible and trustworthy before adding broader mobile control or new deployment actions.

## Recommended Priority Ladder

### 1. Deployment Readiness Slice

Goal: promote the existing deployment/mobile readiness route into a first-class active cockpit surface.

Why first:
- It is already partially implemented and tested.
- It is low-risk compared with introducing new deployment actions.
- It gives operators truthful visibility before any new control surface is added.

Expected scope:
- add active frontend API client for deployment/mobile status
- add a small read-only cockpit panel or card
- surface platform, public URL, wrapper presence, and mobile access state
- keep it read-only for the first slice

Success gate:
- frontend tests for the new panel and API helper
- existing backend deployment/mobile tests remain green
- no new fake or hardcoded deployment state

### 2. Telemetry Backbone Slice

Goal: define the canonical live metrics that deployment and mobile surfaces can trust.

Why second:
- deployment gating and mobile presence should not depend on decorative telemetry
- the codebase already has multiple telemetry-shaped surfaces; this slice should normalize which one is authoritative

Expected scope:
- identify canonical mission, agent, and operator-presence counters
- expose a stable backend summary route or expand an existing truthful one
- avoid streaming-first work until the summary contract is stable

Success gate:
- mirrored backend tests on both server surfaces
- one active frontend consumer uses the canonical summary

### 3. Deployment Gate Slice

Goal: add operator-governed deploy approval as a real workflow rather than a docs-only concept.

Why third:
- after readiness and telemetry exist, approval decisions have truthful inputs
- this avoids creating a deploy button backed by guesswork

Expected scope:
- additive deploy proposal model
- operator approval state
- artifact trail for proposal, approval, and rejection
- no automatic infrastructure mutation in the first gate slice

Success gate:
- proposal lifecycle is deterministic and audited
- no destructive deploy action is introduced without explicit operator approval semantics

### 4. Mobile Companion Readiness Slice

Goal: connect the mobile wrapper and mobile access configuration to the already-truthful companion flow.

Why fourth:
- mobile should consume existing governed backend flows, not fork them
- by this stage the system can expose truthful readiness and approval state to mobile clients

Expected scope:
- confirm mobile entry route and companion access assumptions
- expose mobile-safe companion status and availability
- keep command scope narrow and operator-centric

Success gate:
- mobile-facing status contract is deterministic
- no separate mobile-only mission logic is introduced

### 5. Live Deployment and Mobile Control Slice

Goal: only after the previous four slices are green, add tightly governed control actions.

Why last:
- this is the highest-risk part of v2.2.0
- it should build on truthful readiness, telemetry, and approval rails already in place

Expected scope:
- explicit approval-bound actions
- clear operator feedback and artifacts
- mobile control limited to already-governed actions

## Recommended First Coding Slice

Start with the Deployment Readiness Slice.

Exact reason:
- the backend route and tests already exist
- the active frontend does not yet appear to treat this as a first-class operator panel
- it is the smallest honest step toward v2.2.0 from the clean baseline

Likely files for that slice:
- `frontend/src/api/`
- `frontend/src/components/`
- `frontend/src/pages/NexusmonPage.tsx`
- frontend tests beside the new helper and panel

Likely files to verify but not expand unless needed:
- `nexusmon_server.py`
- `swarmz_runtime/api/deployment_mobile_status.py`
- `tests/test_deployment_mobile_status.py`
- `tests/test_deployment_mobile_status_endpoints.py`

## Explicit Non-Goals For The Next Turn

- no full mobile app rewrite
- no auto-deploy execution
- no decorative telemetry stream that lacks backend truth
- no new mixed mega-slice spanning mobile UI, deploy actions, and telemetry at once

## Decision

The next coding turn should be a small v2.2.0 read-only deployment readiness panel backed by the existing `/v1/deployment/mobile-status` contract, with telemetry and deployment gating deferred to the following slices.