import { describe, expect, test } from "vitest";
import {
  isRealMissionPanelEnabled,
  mapReadModelMission,
  mergeMissionPanelData,
} from "../components/missionPanelReadModel";
import type {
  MissionReadItem,
  MissionStatus,
} from "../api/system";

describe("missionPanelReadModel", () => {
  test("parses feature flag values conservatively", () => {
    expect(isRealMissionPanelEnabled("true")).toBe(true);
    expect(isRealMissionPanelEnabled("YES")).toBe(true);
    expect(isRealMissionPanelEnabled("0")).toBe(false);
    expect(isRealMissionPanelEnabled(undefined)).toBe(false);
  });

  test("keeps read-model missions authoritative and overlays lifecycle detail", () => {
    const lifecycleMission: MissionStatus = {
      mission_id: "mission-live",
      state: "RUNNING",
      history: [{ state: "RUNNING", timestamp: "2026-03-07T00:01:00Z" }],
      bridge_output: null,
      mode: "strategic",
      timestamp: "2026-03-07T00:01:00Z",
    };
    const readModelItems: MissionReadItem[] = [
      {
        id: "mission-live",
        mission_id: "mission-live",
        title: "Duplicate runtime mission",
        status: "running",
        status_raw: "RUNNING",
        category: "analysis",
        created_at: "2026-03-07T00:00:00Z",
        updated_at: "2026-03-07T00:00:30Z",
        created_by: "operator",
        risk_level: "low",
        latest_run_id: "run-1",
        source: "runtime_engine",
        truth: "backend",
        execution_backed: false,
        execution_truth_label: "LIFECYCLE STATE ONLY",
        execution_truth_detail: "Execution not yet wired.",
      },
      {
        id: "mission-persisted",
        mission_id: "mission-persisted",
        title: "Persisted mission",
        status: "queued",
        status_raw: "PENDING",
        category: "analysis",
        created_at: "2026-03-07T00:02:00Z",
        updated_at: "2026-03-07T00:02:00Z",
        created_by: "operator",
        risk_level: "unknown",
        latest_run_id: "",
        source: "legacy_jsonl",
        truth: "backend",
        execution_backed: false,
        execution_truth_label: "QUEUED RECORD",
        execution_truth_detail: "Queued in backend contract.",
      },
    ];

    const merged = mergeMissionPanelData({
      lifecycleMissions: [lifecycleMission],
      readModelItems,
      previousStates: {},
      includeReadModel: true,
    });

    expect(merged.missions).toHaveLength(2);
    expect(merged.missions[0].mission_id).toBe("mission-persisted");
    expect(merged.missions[1]).toMatchObject({
      mission_id: "mission-live",
      state: "RUNNING",
      title: "Duplicate runtime mission",
      sourceLabel: "API MISSIONS",
      actionsEnabled: true,
      executionLabel: "LIFECYCLE STATE ONLY",
      lifecycleState: "RUNNING",
    });
    expect(merged.missions[1].executionDetail).toContain("Execution not yet wired");
    expect(merged.missions[1].lifecycleDetail).toContain("/v1/missions/status");
    expect(merged.missions[0]).toMatchObject({
      mission_id: "mission-persisted",
      title: "Persisted mission",
      executionLabel: "QUEUED RECORD",
      sourceLabel: "API MISSIONS",
    });
  });

  test("emits bridge output only for newly completed lifecycle missions", () => {
    const completedMission: MissionStatus = {
      mission_id: "mission-complete",
      state: "COMPLETED",
      history: [{ state: "COMPLETED", timestamp: "2026-03-07T00:03:00Z" }],
      bridge_output: "Mission complete",
      mode: "combat",
      timestamp: "2026-03-07T00:03:00Z",
    };

    const firstMerge = mergeMissionPanelData({
      lifecycleMissions: [completedMission],
      readModelItems: [],
      previousStates: {},
      includeReadModel: false,
    });
    const secondMerge = mergeMissionPanelData({
      lifecycleMissions: [completedMission],
      readModelItems: [],
      previousStates: firstMerge.previousStates,
      includeReadModel: false,
    });

    expect(firstMerge.bridgeOutputs).toEqual([
      {
        mission_id: "mission-complete",
        message: "Mission complete",
        mode: "combat",
        backendBacked: true,
      },
    ]);
    expect(secondMerge.bridgeOutputs).toEqual([]);
  });

  test("maps canonical mission read-model status to cockpit state", () => {
    expect(
      mapReadModelMission({
        id: "mission-blocked",
        mission_id: "mission-blocked",
        title: "Blocked mission",
        status: "blocked",
        status_raw: "DENIED",
        category: "analysis",
        created_at: "2026-03-07T00:04:00Z",
        updated_at: "2026-03-07T00:04:30Z",
        created_by: "operator",
        risk_level: "high",
        latest_run_id: "",
        source: "runtime_engine",
        truth: "backend",
        execution_backed: false,
        execution_truth_label: "READ-MODEL ONLY",
        execution_truth_detail: "Display-only backend record.",
      }),
    ).toMatchObject({
      state: "FAILED",
      executionLabel: "READ-MODEL ONLY",
      sourceLabel: "API MISSIONS",
    });
  });
});