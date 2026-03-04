import { useCallback, useEffect, useState } from "react";

export interface ProposalEntry {
  proposal_id: string;
  title: string;
  rationale: string;
  steps: unknown[];
  proposed_at: string;
  status: "pending" | "approved" | "rejected";
  decided_at: string | null;
  outcome: unknown | null;
}

interface AutonomyState {
  queue: ProposalEntry[];
  history: ProposalEntry[];
  loading: boolean;
  error: string | null;
}

export function useAutonomy() {
  const [state, setState] = useState<AutonomyState>({
    queue: [],
    history: [],
    loading: true,
    error: null,
  });

  const fetchState = useCallback(async () => {
    try {
      const [queueRes, histRes] = await Promise.all([
        fetch("/v1/autonomy/queue"),
        fetch("/v1/autonomy/history"),
      ]);
      const queue = await queueRes.json();
      const hist = await histRes.json();
      setState((s) => ({
        ...s,
        queue: queue.queue ?? [],
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

  const propose = useCallback(
    async (title: string, steps: unknown[], rationale: string = "") => {
      try {
        const res = await fetch("/v1/autonomy/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, steps, rationale }),
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

  const approve = useCallback(
    async (proposalId: string, operatorKey: string) => {
      try {
        const res = await fetch(`/v1/autonomy/approve/${proposalId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operator_key: operatorKey }),
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

  const reject = useCallback(
    async (proposalId: string, reason: string = "") => {
      try {
        const res = await fetch(`/v1/autonomy/reject/${proposalId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
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

  return { ...state, fetchState, propose, approve, reject };
}
