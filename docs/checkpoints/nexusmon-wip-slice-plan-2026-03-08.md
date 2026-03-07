# NEXUSMON WIP Slice Plan

Date: 2026-03-08

Purpose: classify the current dirty working tree into commit-safe slices before freezing any more work.

Status: planning artifact only. This is not a green checkpoint.

## Rules

- additive only
- no new feature work until validated slices are frozen
- `main` is canonical
- isolate the smallest already-verified slice first
- run focused validation per slice
- run full regression only after slice cleanup is complete

## Bucket 1: Already-Verified Work That Should Be Committed First

### Reason

These files map to work already reflected in the last clean checkpoint or to low-risk repo cleanup that does not introduce new product behavior.

### Safe To Commit Now

Yes, but in small commits rather than one combined batch.

### Files

- `.env.example`
- `.github/workflows/ci.yml`
- `.gitignore`
- `core/api/mission_read_model.py`
- `frontend/src/api/artifacts.ts`
- `frontend/src/api/client.ts`
- `frontend/src/api/system.ts`
- `frontend/src/components/ArtifactVaultPanel.tsx`
- `frontend/src/components/CompanionCoreCard.tsx`
- `frontend/src/components/CosmicQueryPanel.tsx`
- `frontend/src/components/KernelShiftPanel.tsx`
- `frontend/src/components/MissionLifecycleCard.tsx`
- `frontend/src/components/NexusmonBridgeOutput.tsx`
- `frontend/src/components/missionPanelReadModel.ts`
- `frontend/src/hooks/useBridgeOutput.ts`
- `frontend/src/hooks/useCompanionCore.ts`
- `frontend/src/pages/CompanionCorePage.tsx`
- `frontend/src/utils/api.ts`
- `frontend/vite.config.ts`
- `cockpit/src/artifactSync.js`
- `cockpit/src/missionSync.js`
- `cockpit/src/supplySync.js`
- `nexusmon/hologram/hologram_reconciler.py`
- `swarmz_runtime/api/missions.py`
- `archive/operator/operator_console/__init__.py`
- `archive/dev/demo_scripts/__init__.py`
- `archive/dev/demo_scripts/decision_space_demo.py`
- `archive/dev/demo_scripts/infra_simulation_demo.py`
- `archive/dev/demo_scripts/network_sim_demo.py`
- `archive/static/public/plugins/community.json`
- `archive/tools/forge/sensor_monitor_v1.py`
- `archive/tools/paste-agent/examples/__init__.py`
- `archive/tools/paste-agent/paste_agent/__init__.py`
- `archive/tools/paste-agent/tests/__init__.py`
- delete `dev/__init__.py`
- delete `dev/decision_space_demo.py`
- delete `dev/infra_simulation_demo.py`
- delete `dev/network_sim_demo.py`
- delete `forge/sensor_monitor_v1.py`
- delete `operator_console/__init__.py`
- delete `paste-agent/examples/__init__.py`
- delete `paste-agent/paste_agent/__init__.py`
- delete `paste-agent/tests/__init__.py`
- delete `public/plugins/community.json`

### Validation Commands

```powershell
git diff --check -- .env.example .github/workflows/ci.yml .gitignore core/api/mission_read_model.py frontend/src/api/artifacts.ts frontend/src/api/client.ts frontend/src/api/system.ts frontend/src/components/ArtifactVaultPanel.tsx frontend/src/components/CompanionCoreCard.tsx frontend/src/components/CosmicQueryPanel.tsx frontend/src/components/KernelShiftPanel.tsx frontend/src/components/MissionLifecycleCard.tsx frontend/src/components/NexusmonBridgeOutput.tsx frontend/src/components/missionPanelReadModel.ts frontend/src/hooks/useBridgeOutput.ts frontend/src/hooks/useCompanionCore.ts frontend/src/pages/CompanionCorePage.tsx frontend/src/utils/api.ts frontend/vite.config.ts cockpit/src/artifactSync.js cockpit/src/missionSync.js cockpit/src/supplySync.js nexusmon/hologram/hologram_reconciler.py swarmz_runtime/api/missions.py

Set-Location frontend
npm run test -- --run src/__tests__/apiClient.test.ts src/__tests__/missionPanelReadModel.test.ts src/__tests__/ArtifactVaultPanel.test.ts src/__tests__/NexusmonBridgeOutput.test.ts src/__tests__/artifactsApi.test.ts src/__tests__/useCompanionCore.test.ts
Set-Location ..

pytest tests/api/test_both_surfaces.py tests/test_dashboard_browser_smoke.py tests/test_swarmz_server.py tests/test_system_control.py -q
```

## Bucket 2: WIP Backend Slice

### Reason

This is new backend surface area for bond and supply. It is not part of the green baseline and it introduces new contracts, persistence behavior, and route shapes.

### Safe To Commit Now

No.

### Files

- `core/bond/__init__.py`
- `core/bond/memory.py`
- `core/bond/state.py`
- `core/bond/voice.py`
- `core/supply/__init__.py`
- `core/supply/billing.py`
- `core/supply/evaluator.py`
- `core/supply/models.py`
- `core/supply/registry.py`
- `swarmz_runtime/api/bond.py`
- `swarmz_runtime/api/supply.py`

### Validation Commands

```powershell
pytest tests/api/test_bond_status.py tests/test_bond_memory.py tests/test_bond_state.py tests/test_bond_voice.py -q
pytest tests/api/test_supply_network.py tests/test_supply_network.py -q
```

## Bucket 3: WIP Frontend Slice

### Reason

This is the active cockpit restructure around bond presence, supply visibility, and mission command wiring. It depends on new backend WIP.

### Safe To Commit Now

No.

### Files

- `frontend/src/App.tsx`
- `frontend/src/api/supply.ts`
- `frontend/src/components/NexusmonCockpitLayout.tsx`
- `frontend/src/components/NexusmonMissionCommandCard.tsx`
- `frontend/src/components/NexusmonPresencePanel.tsx`
- `frontend/src/components/OperatorMemoryPanel.tsx`
- `frontend/src/components/SupplyNetworkPanel.tsx`
- `frontend/src/hooks/useBondStatus.ts`
- `frontend/src/hooks/useSupplyNetwork.ts`
- `frontend/src/pages/NexusmonPage.tsx`
- `frontend/src/types/bond.ts`

### Validation Commands

```powershell
Set-Location frontend
npm run test -- --run src/__tests__/NexusmonPresencePanel.test.ts src/__tests__/supplyApi.test.ts
npx tsc --noEmit
npm run build
```

## Bucket 4: Tests Added Or Changed

### Reason

Tests should move with the slice they prove. They should not be committed as an independent batch.

### Safe To Commit Now

Partially. Safe tests can ship with already-verified slices. Bond and supply tests should wait for their matching WIP slices.

### Files

- `frontend/src/__tests__/missionPanelReadModel.test.ts`
- `frontend/src/__tests__/ArtifactVaultPanel.test.ts`
- `frontend/src/__tests__/NexusmonBridgeOutput.test.ts`
- `frontend/src/__tests__/NexusmonPresencePanel.test.ts`
- `frontend/src/__tests__/apiClient.test.ts`
- `frontend/src/__tests__/artifactsApi.test.ts`
- `frontend/src/__tests__/supplyApi.test.ts`
- `frontend/src/__tests__/useCompanionCore.test.ts`
- `tests/__init__.py`
- `tests/api/__init__.py`
- `tests/api/test_both_surfaces.py`
- `tests/api/test_bond_status.py`
- `tests/api/test_supply_network.py`
- `tests/test_bond_memory.py`
- `tests/test_bond_state.py`
- `tests/test_bond_voice.py`
- `tests/test_dashboard_browser_smoke.py`
- `tests/test_observatory_log_compression.py`
- `tests/test_operator_rank.py`
- `tests/test_supply_network.py`
- `tests/test_swarmz_server.py`
- `tests/test_system_control.py`

### Validation Commands

Use the command set for the slice the test belongs to.

## Bucket 5: Docs / Checkpoints / Memory Files

### Reason

These files document branch policy, compaction, current public positioning, and the last known-good baseline. They are ideal for the smallest first freeze.

### Safe To Commit Now

Yes.

### Files

- `PRESS_KIT.md`
- `README.md`
- `docs/CONTRIBUTING.md`
- `docs/ROADMAP.md`
- `docs/repository_layout.md`
- `docs/TECHNICAL_OVERVIEW.md`
- `docs/checkpoints/nexusmon-green-baseline.md`
- `docs/checkpoints/nexusmon-wip-slice-plan-2026-03-08.md`
- `docs/github_presence_pack.md`
- `docs/root_compaction_audit_2026-03-07.md`
- `docs/root_compaction_audit_batch2_2026-03-07.md`
- `docs/root_compaction_plan_2026-03-07.md`
- `docs/status/branch_normalization_complete_2026-03-07.md`
- `docs/status/branch_normalization_plan_2026-03-07.md`

### Validation Commands

```powershell
git diff --check -- PRESS_KIT.md README.md docs/CONTRIBUTING.md docs/ROADMAP.md docs/repository_layout.md docs/TECHNICAL_OVERVIEW.md docs/checkpoints/nexusmon-green-baseline.md docs/checkpoints/nexusmon-wip-slice-plan-2026-03-08.md docs/github_presence_pack.md docs/root_compaction_audit_2026-03-07.md docs/root_compaction_audit_batch2_2026-03-07.md docs/root_compaction_plan_2026-03-07.md docs/status/branch_normalization_complete_2026-03-07.md docs/status/branch_normalization_plan_2026-03-07.md
```

## Bucket 6: Unsafe Mixed Files That Need Manual Review

### Reason

These files mix already-verified work and new WIP across shared server surfaces, lifecycle contracts, and operator-memory side effects.

### Safe To Commit Now

No.

### Files

- `cockpit/src/CockpitV4.jsx`
- `nexusmon_server.py`
- `swarmz_runtime/api/mission_lifecycle.py`
- `swarmz_runtime/api/server.py`
- `swarmz_runtime/operator/memory.py`

### Validation Commands

```powershell
pytest tests/api/test_both_surfaces.py tests/test_system_control.py tests/api/test_bond_status.py tests/api/test_supply_network.py -q

Set-Location frontend
npm run build
```

## Bucket 7: Files That Should Not Be Committed Yet

### Reason

These are generated or duplicate-noise files that would blur the freeze boundary.

### Safe To Commit Now

No.

### Files

- `core/manifests/registry.json`
- `prepared_actions/schedules/cat_test_schedule/proposal.json`
- `tests/api/test_supply_network_route.py`

## Commit Order

### FIRST COMMIT

Docs and cleanup only:

- `PRESS_KIT.md`
- `README.md`
- `docs/CONTRIBUTING.md`
- `docs/ROADMAP.md`
- `docs/repository_layout.md`
- `docs/TECHNICAL_OVERVIEW.md`
- `docs/checkpoints/nexusmon-green-baseline.md`
- `docs/checkpoints/nexusmon-wip-slice-plan-2026-03-08.md`
- `docs/github_presence_pack.md`
- `docs/root_compaction_audit_2026-03-07.md`
- `docs/root_compaction_audit_batch2_2026-03-07.md`
- `docs/root_compaction_plan_2026-03-07.md`
- `docs/status/branch_normalization_complete_2026-03-07.md`
- `docs/status/branch_normalization_plan_2026-03-07.md`
- archive moves plus corresponding root deletions

### SECOND COMMIT

Smallest isolated already-verified runtime slice:

- `.env.example`
- `frontend/src/api/client.ts`
- `frontend/src/utils/api.ts`
- `frontend/vite.config.ts`
- `frontend/src/__tests__/apiClient.test.ts`
- `tests/test_dashboard_browser_smoke.py`
- `tests/test_swarmz_server.py`

Then repeat with the next isolated verified slice:

- mission truth
- artifact rail
- SEAL / TRANSMIT truthful wiring

### HOLD / REVIEW

Do not stage mixed shared-surface files or bond/supply WIP until isolated verified slices are frozen.

### FULL REGRESSION LAST

```powershell
pytest tests/ --tb=short -q

Set-Location frontend
npm run test -- --run
npx tsc --noEmit
npm run build
```