import { useCallback, useEffect, useState } from "react";

export interface ApprovalResult {
  approved: boolean;
  action: string;
  seal_level: string;
  reason: string;
  token: string | null;
}

interface SealMatrixState {
  registry: Record<string, string>;
  pending: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

export function useSealMatrix() {
  const [state, setState] = useState<SealMatrixState>({
    registry: {},
    pending: {},
    loading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, pendingRes] = await Promise.all([
        fetch("/v1/seal/status"),
        fetch("/v1/seal/pending"),
      ]);
      const status = await statusRes.json();
      const pending = await pendingRes.json();
      setState((s) => ({
        ...s,
        registry: status.registry ?? {},
        pending: pending.pending ?? {},
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
    void fetchStatus();
  }, [fetchStatus]);

  const approve = useCallback(
    async (action: string, operatorKey: string, providedHash?: string) => {
      try {
        const res = await fetch("/v1/seal/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            operator_key: operatorKey,
            provided_hash: providedHash ?? null,
          }),
        });
        const data = (await res.json()) as ApprovalResult & { error?: string };
        void fetchStatus();
        return data;
      } catch (err) {
        return {
          approved: false,
          action,
          seal_level: "UNKNOWN",
          reason: err instanceof Error ? err.message : String(err),
          token: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [fetchStatus]
  );

  return { ...state, fetchStatus, approve };
}
