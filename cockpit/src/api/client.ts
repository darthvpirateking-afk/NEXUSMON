const BASE = (import.meta.env.VITE_API_URL as string) ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: {
    basic: () => request<any>("/api/health"),
    deep: () => request<any>("/api/health/deep"),
    bridge: () => request<any>("/api/health/bridge"),
    governance: () => request<any>("/api/health/governance"),
    orchestrator: () => request<any>("/api/health/orchestrator"),
    avatar: () => request<any>("/api/health/avatar"),
  },
  missions: {
    dispatch: (type: string, payload: any) =>
      request<any>("/api/missions", {
        method: "POST",
        body: JSON.stringify({ type, payload }),
      }),
    list: (limit = 50) => request<any>(`/api/missions?limit=${limit}`),
    get: (id: string) => request<any>(`/api/missions/${id}`),
    governance: (id: string) => request<any>(`/api/missions/${id}/governance`),
    artifacts: (id: string) => request<any>(`/api/missions/${id}/artifacts`),
    cancel: (id: string) =>
      request<any>(`/api/missions/${id}/cancel`, {
        method: "POST",
      }),
  },
  audit: {
    get: (missionId?: string) =>
      request<any>(`/api/audit${missionId ? `?mission_id=${missionId}` : ""}`),
    stream: () => new EventSource(`${BASE}/api/audit/stream`),
  },
  avatar: {
    get: () => request<any>("/api/avatar"),
    xp: () => request<any>("/api/avatar/xp"),
  },
};
