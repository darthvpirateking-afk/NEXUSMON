import { type MissionReadItem, type MissionStatus } from "../api/system";

export type DisplayMission = {
  mission_id: string;
  state: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  actionsEnabled: boolean;
  sourceLabel: string;
};

export type BridgeOutputUpdate = {
  mission_id: string;
  message: string;
  mode: string | null;
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

export function isRealMissionPanelEnabled(
  flagValue: string | null | undefined,
): boolean {
  return /^(1|true|yes)$/i.test(flagValue ?? "");
}

export function mapLifecycleMission(mission: MissionStatus): DisplayMission {
  return {
    mission_id: mission.mission_id,
    state: mission.state,
    title: mission.bridge_output ?? "Lifecycle mission",
    createdAt: mission.timestamp,
    updatedAt: mission.timestamp,
    actionsEnabled: true,
    sourceLabel: "LIFECYCLE",
  };
}

export function mapReadModelMission(mission: MissionReadItem): DisplayMission {
  return {
    mission_id: mission.mission_id,
    state: READ_MODEL_STATE[mission.status] ?? mission.status_raw.toUpperCase(),
    title: mission.title,
    createdAt: mission.created_at,
    updatedAt: mission.updated_at,
    actionsEnabled: false,
    sourceLabel: "READ MODEL",
  };
}

export function mergeMissionPanelData(args: {
  lifecycleMissions: MissionStatus[];
  readModelItems: MissionReadItem[];
  previousStates: Record<string, string>;
  includeReadModel: boolean;
}): MissionPanelMergeResult {
  const nextMissions: DisplayMission[] = [];
  const seenMissionIds = new Set<string>();
  const nextPreviousStates = { ...args.previousStates };
  const bridgeOutputs: BridgeOutputUpdate[] = [];

  for (const mission of args.lifecycleMissions) {
    if (
      mission.state === "COMPLETED" &&
      nextPreviousStates[mission.mission_id] !== "COMPLETED"
    ) {
      bridgeOutputs.push({
        mission_id: mission.mission_id,
        message: mission.bridge_output ?? `Mission ${mission.mission_id} completed`,
        mode: mission.mode ?? null,
      });
    }
    nextPreviousStates[mission.mission_id] = mission.state;
    nextMissions.push(mapLifecycleMission(mission));
    seenMissionIds.add(mission.mission_id);
  }

  if (args.includeReadModel) {
    for (const mission of args.readModelItems) {
      if (seenMissionIds.has(mission.mission_id)) {
        continue;
      }
      nextMissions.push(mapReadModelMission(mission));
      seenMissionIds.add(mission.mission_id);
    }
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