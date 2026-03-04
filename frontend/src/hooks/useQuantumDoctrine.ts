import { useCallback, useEffect, useState } from "react";

export interface QuantumStateEntry {
  name: string;
  snapshot_at: string;
  kernel_config: Record<string, unknown>;
  evolution_stage: string;
  traits: string[];
}

export interface CollapseEntry {
  collapsed_to: string;
  snapshot_at: string;
  collapsed_at: string;
  restored_actions: string[];
}

interface QuantumDoctrineState {
  states: QuantumStateEntry[];
  history: CollapseEntry[];
  loading: boolean;
  error: string | null;
}

export function useQuantumDoctrine() {
  const [state, setState] = useState<QuantumDoctrineState>({
    states: [],
    history: [],
    loading: true,
    error: null,
  });

  const fetchState = useCallback(async () => {
    try {
      const [statesRes, histRes] = await Promise.all([
        fetch("/v1/quantum/states"),
        fetch("/v1/quantum/history"),
      ]);
      const states = await statesRes.json();
      const hist = await histRes.json();
      setState((s) => ({
        ...s,
        states: states.states ?? [],
        history: hist.history ?? [],
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const snapshot = useCallback(
    async (name: string) => {
      try {
        const res = await fetch("/v1/quantum/snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!data.error) void fetchState();
        return data;
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchState]
  );

  const collapse = useCallback(
    async (name: string, operatorKey: string) => {
      try {
        const res = await fetch("/v1/quantum/collapse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, operator_key: operatorKey }),
        });
        const data = await res.json();
        if (!data.error) void fetchState();
        return data;
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchState]
  );

  return { ...state, fetchState, snapshot, collapse };
}
