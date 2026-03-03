import { useCallback, useEffect, useState } from "react";

export interface AgentRegistration {
  agent_id: string;
  mode: string;
  registered_at: string;
}

export interface AgentResult {
  agent_id: string;
  mode: string;
  status: "complete" | "error";
  output: string | null;
  error: string | null;
  tokens: number;
  latency_ms: number;
}

export interface CoordinationResult {
  ok: boolean;
  federation_id: string;
  goal: string;
  agent_results: AgentResult[];
  created_at: string;
  completed_at: string;
  error?: string;
}

interface FederationState {
  agents: AgentRegistration[];
  loading: boolean;
  coordinating: boolean;
  lastResult: CoordinationResult | null;
  error: string | null;
}

export function useFederation(pollMs: number = 5000) {
  const [state, setState] = useState<FederationState>({
    agents: [],
    loading: true,
    coordinating: false,
    lastResult: null,
    error: null,
  });

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/v1/federation/agents");
      const data = (await res.json()) as { agents: AgentRegistration[] };
      setState((s) => ({ ...s, agents: data.agents ?? [], loading: false, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }, []);

  useEffect(() => {
    void fetchAgents();
    const id = setInterval(() => void fetchAgents(), pollMs);
    return () => clearInterval(id);
  }, [fetchAgents, pollMs]);

  const register = useCallback(async (agentId: string, mode: string = "strategic") => {
    try {
      const res = await fetch("/v1/federation/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, mode }),
      });
      const data = await res.json();
      if (!data.error) void fetchAgents();
      return data;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [fetchAgents]);

  const coordinate = useCallback(async (goal: string, budgetTokens: number = 2048) => {
    setState((s) => ({ ...s, coordinating: true, error: null }));
    try {
      const res = await fetch("/v1/federation/coordinate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, budget_tokens: budgetTokens }),
      });
      const data = (await res.json()) as CoordinationResult;
      if (data.error) {
        setState((s) => ({ ...s, coordinating: false, error: data.error ?? null }));
      } else {
        setState((s) => ({ ...s, coordinating: false, lastResult: data, error: null }));
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, coordinating: false, error: msg }));
      return null;
    }
  }, []);

  return { ...state, fetchAgents, register, coordinate };
}
