import { type MissionReadItem, type MissionStatus } from "../api/system";

export type DisplayMission = {
  mission_id: string;
  state: string;
  title: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  actionsEnabled: boolean;
  sourceLabel: string;
  executionLabel: string;
  executionDetail: string;
  lifecycleState?: string;
  lifecycleUpdatedAt?: string;
  lifecycleDetail?: string;
};

export type BridgeOutputUpdate = {
  mission_id: string;
  message: string;
  mode: string | null;
  backendBacked: boolean;
};

export type MissionPanelMergeResult = {
  missions: DisplayMission[];
  previousStates: Record<string, string>;
  bridgeOutputs: BridgeOutputUpdate[];
};

const READ_MODEL_STATE: Record<string, string> = {
  queued: "QUEUED",
  validating: "INITIALIZING",
  approved: "QUEUED",
  running: "RUNNING",
  paused: "PAUSED",
  succeeded: "COMPLETED",
  failed: "FAILED",
  rolled_back: "ABORTED",
  blocked: "FAILED",
};

const PRIMARY_SOURCE_LABEL = "API MISSIONS";
const LIFECYCLE_ONLY_SOURCE_LABEL = "LIFECYCLE ONLY";

function getReadModelExecutionLabel(mission: MissionReadItem, mappedState: string): string {
  return mission.execution_truth_label ?? (
    mappedState === "QUEUED" || mappedState === "INITIALIZING"
      ? "QUEUED RECORD"
      : "READ-MODEL ONLY"
  );
}

function getReadModelExecutionDetail(mission: MissionReadItem): string {
  return mission.execution_truth_detail ?? "Display-only backend record. Execution is not verified from this panel.";
}

function getLifecycleExecutionLabel(mission: MissionStatus): string {
  return mission.execution_truth_label ?? "LIFECYCLE STATE ONLY";
}

function getLifecycleExecutionDetail(mission: MissionStatus): string {
  return mission.execution_truth_detail ?? "Execution not yet wired. This status comes from lifecycle records, not verified engine activity.";
}

function overlayLifecycleStatus(primaryMission: DisplayMission, mission: MissionStatus): DisplayMission {
  const lifecycleTimestamp = mission.timestamp;
  const primaryTimestamp = primaryMission.updatedAt ?? primaryMission.createdAt;
  const resolvedUpdatedAt = (() => {
    const lifecycleTime = Date.parse(lifecycleTimestamp ?? "") || 0;
    const primaryTime = Date.parse(primaryTimestamp ?? "") || 0;
    if (lifecycleTime >= primaryTime) {
      return lifecycleTimestamp;
    }
    return primaryMission.updatedAt;
  })();

  return {
    ...primaryMission,
    actionsEnabled: true,
    category: primaryMission.category ?? mission.category,
    createdAt: primaryMission.createdAt ?? mission.created_at ?? lifecycleTimestamp,
    updatedAt: resolvedUpdatedAt,
    lifecycleState: mission.state,
    lifecycleUpdatedAt: mission.timestamp,
    lifecycleDetail: `Lifecycle overlay: ${mission.state} from /v1/missions/status.`,
  };
}

export function isRealMissionPanelEnabled(
  flagValue: string | null | undefined,
): boolean {
  return /^(1|true|yes)$/i.test(flagValue ?? "");
}

export function mapLifecycleMission(mission: MissionStatus): DisplayMission {
  return {
    mission_id: mission.mission_id,
    state: mission.state,
    title: mission.goal ?? `Mission ${mission.mission_id}`,
    category: mission.category,
    createdAt: mission.created_at ?? mission.timestamp,
    updatedAt: mission.timestamp,
    actionsEnabled: true,
    sourceLabel: LIFECYCLE_ONLY_SOURCE_LABEL,
    executionLabel: getLifecycleExecutionLabel(mission),
    executionDetail: getLifecycleExecutionDetail(mission),
    lifecycleState: mission.state,
    lifecycleUpdatedAt: mission.timestamp,
    lifecycleDetail: `Lifecycle overlay: ${mission.state} from /v1/missions/status.`,
  };
}

export function mapReadModelMission(mission: MissionReadItem): DisplayMission {
  const mappedState = READ_MODEL_STATE[mission.status] ?? mission.status_raw.toUpperCase();
  return {
    mission_id: mission.mission_id,
    state: mappedState,
    title: mission.title,
    category: mission.category,
    createdAt: mission.created_at,
    updatedAt: mission.updated_at,
    actionsEnabled: false,
    sourceLabel: PRIMARY_SOURCE_LABEL,
    executionLabel: getReadModelExecutionLabel(mission, mappedState),
    executionDetail: getReadModelExecutionDetail(mission),
  };
}

export function mergeMissionPanelData(args: {
  lifecycleMissions: MissionStatus[];
  readModelItems: MissionReadItem[];
  previousStates: Record<string, string>;
  includeReadModel: boolean;
}): MissionPanelMergeResult {
  const nextMissions: DisplayMission[] = [];
  const missionIndex = new Map<string, number>();
  const nextPreviousStates = { ...args.previousStates };
  const bridgeOutputs: BridgeOutputUpdate[] = [];

  if (args.includeReadModel) {
    for (const mission of args.readModelItems) {
      missionIndex.set(mission.mission_id, nextMissions.length);
      nextMissions.push(mapReadModelMission(mission));
    }
  }

  for (const mission of args.lifecycleMissions) {
    if (
      mission.state === "COMPLETED" &&
      nextPreviousStates[mission.mission_id] !== "COMPLETED"
    ) {
      bridgeOutputs.push({
        mission_id: mission.mission_id,
        message: mission.bridge_output ?? `Mission ${mission.mission_id} completed`,
        mode: mission.mode ?? null,
        backendBacked: Boolean(mission.bridge_output),
      });
    }
    nextPreviousStates[mission.mission_id] = mission.state;

    const existingIndex = missionIndex.get(mission.mission_id);
    if (args.includeReadModel && existingIndex !== undefined) {
      nextMissions[existingIndex] = overlayLifecycleStatus(nextMissions[existingIndex], mission);
      continue;
    }

    missionIndex.set(mission.mission_id, nextMissions.length);
    nextMissions.push(mapLifecycleMission(mission));
  }

  nextMissions.sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt ?? left.createdAt ?? "") || 0;
    const rightTime = Date.parse(right.updatedAt ?? right.createdAt ?? "") || 0;
    return rightTime - leftTime;
  });

  return {
    missions: nextMissions,
    previousStates: nextPreviousStates,
    bridgeOutputs,
  };
}