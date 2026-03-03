import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

export interface EvolutionStatus {
  agent_id: string;
  stage: string;
  visual_state: string;
  xp: number;
  xp_pct: number;
  next_stage: string | null;
  next_threshold: number | null;
  trait_scores: Record<string, number>;
  history: {
    event: string;
    stage?: string;
    xp_at_advance?: number;
    amount?: number;
    source?: string;
    total_xp?: number;
    timestamp: string;
  }[];
}

export function useEvolution(agentId = "nexusmon") {
  const [data, setData] = useState<EvolutionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<EvolutionStatus>(`/v1/evolution/status/${agentId}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 15000);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    stage: data?.stage ?? "ORIGIN",
    xp: data?.xp ?? 0,
    xpPct: data?.xp_pct ?? 0,
    traits: data?.trait_scores ?? {},
    history: data?.history ?? [],
    visualState: data?.visual_state ?? "dormant-core",
    nextStage: data?.next_stage ?? null,
    nextThreshold: data?.next_threshold ?? null,
    loading,
    error,
    refresh,
    data,
  };
}
