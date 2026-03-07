import { apiGet, apiPost } from "./client";

export type ArtifactStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type ArtifactType =
  | "TEXT"
  | "CODE"
  | "DATA"
  | "REPORT"
  | "ANALYSIS"
  | "DECISION"
  | "LOG";

export interface Artifact {
  id: string;
  version: number;
  mission_id: string | null;
  task_id: string;
  type: ArtifactType;
  title: string;
  content: unknown;
  input_snapshot: Record<string, unknown>;
  status: ArtifactStatus;
  operator_notes: string;
  created_at: string;
  reviewed_at: string;
  reviewed_by: string;
  previous_version_id: string;
}

export interface ArtifactStats {
  total: number;
  pending_review: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

interface _ListResponse {
  artifacts: Artifact[];
  count: number;
  ok?: boolean;
  error?: string;
}

interface _SingleResponse {
  ok: boolean;
  artifact: Artifact;
}

interface _StatsResponse {
  ok: boolean;
  total: number;
  pending_review: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

interface _HistoryResponse {
  ok: boolean;
  history: Artifact[];
  versions: number;
}

function sortArtifacts(items: Artifact[]): Artifact[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.created_at) || 0;
    const rightTime = Date.parse(right.created_at) || 0;
    return rightTime - leftTime;
  });
}

function filterArtifacts(
  items: Artifact[],
  params?: {
    status?: ArtifactStatus;
    type?: ArtifactType;
    mission_id?: string;
    limit?: number;
  },
): Artifact[] {
  const filtered = items.filter((artifact) => {
    if (params?.status && artifact.status !== params.status) return false;
    if (params?.type && artifact.type !== params.type) return false;
    if (params?.mission_id && artifact.mission_id !== params.mission_id) return false;
    return true;
  });
  const sorted = sortArtifacts(filtered);
  if (params?.limit != null) {
    return sorted.slice(0, params.limit);
  }
  return sorted;
}

function deriveArtifactStats(artifacts: Artifact[]): ArtifactStats {
  const by_status: Record<string, number> = {};
  const by_type: Record<string, number> = {};

  for (const artifact of artifacts) {
    by_status[artifact.status] = (by_status[artifact.status] ?? 0) + 1;
    by_type[artifact.type] = (by_type[artifact.type] ?? 0) + 1;
  }

  return {
    total: artifacts.length,
    pending_review: by_status.PENDING_REVIEW ?? 0,
    by_status,
    by_type,
  };
}

export const artifactsApi = {
  stats: () =>
    apiGet<_ListResponse>("/api/artifacts").then((r): ArtifactStats =>
      deriveArtifactStats(Array.isArray(r.artifacts) ? r.artifacts : []),
    ),

  list: (params?: {
    status?: ArtifactStatus;
    type?: ArtifactType;
    mission_id?: string;
    limit?: number;
  }) => {
    return apiGet<_ListResponse>("/api/artifacts").then((r) => {
      const allArtifacts = Array.isArray(r.artifacts) ? r.artifacts : [];
      const artifacts = filterArtifacts(allArtifacts, params);
      return {
        artifacts,
        total: artifacts.length,
      };
    });
  },

  get: (id: string) =>
    apiGet<_SingleResponse>(`/v1/vault/artifacts/${id}`).then(
      (r) => r.artifact,
    ),

  create: (body: {
    mission_id: string;
    task_id?: string;
    type: ArtifactType;
    title: string;
    content?: unknown;
  }) =>
    apiPost<_SingleResponse>("/v1/vault/artifacts", body).then(
      (r) => r.artifact,
    ),

  approve: (id: string) =>
    apiPost<_SingleResponse>(`/v1/vault/artifacts/${id}/approve`, {}).then(
      (r) => r.artifact,
    ),

  reject: (id: string) =>
    apiPost<_SingleResponse>(`/v1/vault/artifacts/${id}/reject`, {}).then(
      (r) => r.artifact,
    ),

  history: (id: string) =>
    apiGet<_HistoryResponse>(`/v1/vault/artifacts/${id}/history`).then(
      (r) => r.history,
    ),

  byMission: (missionId: string) =>
    apiGet<_ListResponse>(`/v1/vault/missions/${missionId}/artifacts`).then(
      (r) => ({ artifacts: r.artifacts, total: r.count }),
    ),
};

