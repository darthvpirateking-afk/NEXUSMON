import { useCallback, useEffect, useState } from "react";

export interface AgentState {
  agent_id: string;
  swarm_id: string;
  goal: string;
  mode: string;
  status: "running" | "complete" | "error";
  output: string | null;
  error: string | null;
  tokens: number;
  latency_ms: number;
  spawned_at: string;
  completed_at: string | null;
}

export interface SpawnResult {
  ok: boolean;
  swarm_id: string;
  agent: AgentState;
  error?: string;
}

interface SwarmState {
  spawning: boolean;
  lastResult: SpawnResult | null;
  error: string | null;
}

export function useSwarm() {
  const [state, setState] = useState<SwarmState>({
    spawning: false,
    lastResult: null,
    error: null,
  });

  const spawn = useCallback(
    async (goal: string, mode: string = "strategic", agentId: string = "swarm-agent") => {
      setState((s) => ({ ...s, spawning: true, error: null }));
      try {
        const res = await fetch("/v1/swarm/spawn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, mode, agent_id: agentId }),
        });
        const data = (await res.json()) as SpawnResult & { error?: string };
        if (data.error) {
          setState({ spawning: false, lastResult: null, error: data.error });
        } else {
          setState({ spawning: false, lastResult: data, error: null });
        }
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState({ spawning: false, lastResult: null, error: msg });
        return null;
      }
    },
    []
  );

  return { ...state, spawn };
}
