const READ_MODEL_STATE = {
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

const RISK_LEVEL_SCORE = {
  critical: 0.9,
  high: 0.75,
  medium: 0.5,
  low: 0.28,
  unknown: 0.45,
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toClockLabel(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(11, 16) || "--:--";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function chooseWorker({ mode, category }) {
  const normalizedMode = String(mode || "").toLowerCase();
  const normalizedCategory = String(category || "").toLowerCase();
  if (normalizedMode === "combat") return "GLITCHRA";
  if (normalizedMode === "guardian") return "SIGILDRON";
  if (normalizedCategory === "forge") return "SIGILDRON";
  return "BYTEWOLF";
}

function normalizePriority({ riskLevel, state }) {
  const normalizedRiskLevel = String(riskLevel || "unknown").toLowerCase();
  const normalizedState = String(state || "").toUpperCase();
  if (normalizedRiskLevel === "critical" || normalizedRiskLevel === "high") return "HIGH";
  if (normalizedState === "RUNNING" || normalizedState === "ACTIVE" || normalizedState === "FAILED") return "HIGH";
  if (normalizedRiskLevel === "low") return "LOW";
  return "MED";
}

function normalizeRisk({ riskLevel, state }) {
  const normalizedRiskLevel = String(riskLevel || "unknown").toLowerCase();
  if (normalizedRiskLevel in RISK_LEVEL_SCORE) {
    return RISK_LEVEL_SCORE[normalizedRiskLevel];
  }
  const normalizedState = String(state || "").toUpperCase();
  if (normalizedState === "FAILED" || normalizedState === "ABORTED") return 0.82;
  if (normalizedState === "RUNNING" || normalizedState === "ACTIVE") return 0.62;
  return 0.45;
}

function symbolicCode({ missionId, category, title }) {
  const base = String(category || title || missionId || "mission")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || String(missionId || "MISSION").toUpperCase();
}

function lifecycleLogs(mission) {
  const logs = asArray(mission.history).map((entry) => {
    const state = String(entry?.state || "UNKNOWN").toUpperCase();
    return `${state} @ ${toClockLabel(entry?.timestamp)}`;
  });
  if (mission.bridge_output) {
    logs.push(String(mission.bridge_output));
  }
  return logs.length ? logs : ["Lifecycle mission synchronized"];
}

function readModelLogs(mission) {
  return [
    `Read-model state: ${String(mission.status_raw || mission.status || "UNKNOWN").toUpperCase()}`,
    `Source: ${String(mission.source || "backend")}`,
    `Truth: ${String(mission.truth || "backend")}`,
  ];
}

function mapLifecycleMission(mission) {
  const state = String(mission?.state || "QUEUED").toUpperCase();
  const missionId = String(mission?.mission_id || "M-???");
  const title = String(mission?.bridge_output || `Mission ${missionId}`);
  const category = String(mission?.category || "analysis");
  const mode = String(mission?.mode || "strategic");
  const updatedAt = mission?.timestamp || "";
  return {
    id: missionId,
    title,
    status: state,
    priority: normalizePriority({ state, riskLevel: mission?.risk_level }),
    worker: chooseWorker({ mode, category }),
    risk: normalizeRisk({ state, riskLevel: mission?.risk_level }),
    score: state === "COMPLETED" ? 100 : 0,
    symbolic: symbolicCode({ missionId, category, title }),
    ts: toClockLabel(updatedAt),
    logs: lifecycleLogs(mission),
    sourceLabel: "LIFECYCLE",
    actionsEnabled: true,
    _updatedAt: updatedAt,
  };
}

function mapReadModelMission(mission) {
  const state = READ_MODEL_STATE[String(mission?.status || "").toLowerCase()] || String(mission?.status_raw || mission?.status || "UNKNOWN").toUpperCase();
  const missionId = String(mission?.mission_id || mission?.id || "M-???");
  const title = String(mission?.title || missionId);
  const category = String(mission?.category || "analysis");
  const updatedAt = mission?.updated_at || mission?.created_at || "";
  return {
    id: missionId,
    title,
    status: state,
    priority: normalizePriority({ state, riskLevel: mission?.risk_level }),
    worker: chooseWorker({ mode: mission?.mode, category }),
    risk: normalizeRisk({ state, riskLevel: mission?.risk_level }),
    score: state === "COMPLETED" ? 100 : 0,
    symbolic: symbolicCode({ missionId, category, title }),
    ts: toClockLabel(updatedAt),
    logs: readModelLogs(mission),
    sourceLabel: "READ MODEL",
    actionsEnabled: false,
    _updatedAt: updatedAt,
  };
}

function sortByUpdatedAt(items) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left._updatedAt || "") || 0;
    const rightTime = Date.parse(right._updatedAt || "") || 0;
    return rightTime - leftTime;
  });
}

export async function fetchCockpitMissions() {
  const [lifecycleResult, readModelResult] = await Promise.allSettled([
    fetch("/v1/missions/status"),
    fetch("/api/missions"),
  ]);

  const missions = [];
  const seenIds = new Set();

  if (lifecycleResult.status === "fulfilled" && lifecycleResult.value.ok) {
    const lifecyclePayload = await lifecycleResult.value.json();
    for (const mission of asArray(lifecyclePayload?.missions)) {
      const mapped = mapLifecycleMission(mission);
      missions.push(mapped);
      seenIds.add(mapped.id);
    }
  }

  if (readModelResult.status === "fulfilled" && readModelResult.value.ok) {
    const readModelPayload = await readModelResult.value.json();
    for (const mission of asArray(readModelPayload?.items)) {
      const mapped = mapReadModelMission(mission);
      if (seenIds.has(mapped.id)) continue;
      missions.push(mapped);
      seenIds.add(mapped.id);
    }
  }

  return sortByUpdatedAt(missions).map(({ _updatedAt, ...mission }) => mission);
}