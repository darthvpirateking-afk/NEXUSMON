import { apiGet, apiPost } from "./client";

export interface RuntimeStatus {
  status: "running" | "stopped" | "restarting" | "degraded";
  timestamp: string;
  details: {
    started_at?: string;
    stopped_at?: string;
    restart_count?: number;
    last_heartbeat?: string;
  };
}

export interface HeartbeatResponse {
  alive: boolean;
  status: string;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  mission_id: string | null;
  message: string;
  details: Record<string, unknown>;
}

export interface LogsResponse {
  entries: LogEntry[];
  total: number;
  offset: number;
  limit: number;
}

export interface MissionStatus {
  mission_id: string;
  state: string;
  goal?: string;
  category?: string;
  constraints?: Record<string, unknown>;
  created_at?: string;
  history: { state: string; timestamp: string }[];
  bridge_output?: string | null;
  mode?: string | null;
  execution_backed?: boolean;
  execution_truth_label?: string;
  execution_truth_detail?: string;
  timestamp: string;
}

export interface MissionsStatusResponse {
  missions: MissionStatus[];
  total: number;
  timestamp: string;
}

export interface MissionReadItem {
  id: string;
  mission_id: string;
  title: string;
  status: string;
  status_raw: string;
  category: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  risk_level: string;
  latest_run_id: string;
  source: string;
  truth: string;
  execution_backed?: boolean;
  execution_truth_label?: string;
  execution_truth_detail?: string;
}

export interface MissionReadResponse {
  ok?: boolean;
  missions: Record<string, unknown>[];
  count: number;
  items: MissionReadItem[];
  read_model_version: string;
  source: string;
}

export const systemApi = {
  start: () => apiPost<RuntimeStatus>("/v1/system/start", {}),
  stop: () => apiPost<RuntimeStatus>("/v1/system/stop", {}),
  restart: () => apiPost<RuntimeStatus>("/v1/system/restart", {}),
  status: () => apiGet<RuntimeStatus>("/v1/system/status"),
  heartbeat: () => apiGet<HeartbeatResponse>("/v1/system/heartbeat"),
  logs: (params?: { limit?: number; level?: string; source?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.level) qs.set("level", params.level);
    if (params?.source) qs.set("source", params.source);
    const query = qs.toString();
    return apiGet<LogsResponse>(`/v1/system/logs${query ? "?" + query : ""}`);
  },
};

export const missionApi = {
  start: (
    goal: string,
    category = "default",
    mode?: "strategic" | "combat" | "guardian",
  ) =>
    apiPost<{ mission_id: string; state: string; timestamp: string }>(
      "/v1/missions/start",
      {
        goal,
        category,
        ...(mode ? { mode } : {}),
      },
    ),
  stop: (mission_id: string) =>
    apiPost<{ mission_id: string; state: string; timestamp: string }>(
      "/v1/missions/stop",
      { mission_id },
    ),
  pause: (mission_id: string) =>
    apiPost<{ mission_id: string; state: string; timestamp: string }>(
      "/v1/missions/pause",
      { mission_id },
    ),
  resume: (mission_id: string) =>
    apiPost<{ mission_id: string; state: string; timestamp: string }>(
      "/v1/missions/resume",
      { mission_id },
    ),
  status: () => apiGet<MissionsStatusResponse>("/v1/missions/status"),
  readModel: () => apiGet<MissionReadResponse>("/api/missions"),
  statusById: (mission_id: string) =>
    apiGet<MissionStatus>(`/v1/missions/status/${mission_id}`),
  complete: (
    mission_id: string,
    bridge_output: string | null,
    mode: string | null,
  ) =>
    apiPost<{ mission_id: string; state: string; timestamp: string }>(
      "/v1/missions/complete",
      { mission_id, bridge_output, mode },
    ),
};
