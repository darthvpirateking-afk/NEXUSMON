import { useCallback, useEffect, useState } from "react";

export interface ShiftConfig {
  primary_tier: string;
  fallback_chain: object[];
  latency_target_ms: number | null;
  budget_override: Record<string, number>;
}

interface KernelShiftState {
  activeConfig: ShiftConfig | null;
  history: (ShiftConfig & { timestamp: string; type: string })[];
  loading: boolean;
  error: string | null;
}

export function useKernelShift() {
  const [state, setState] = useState<KernelShiftState>({
    activeConfig: null,
    history: [],
    loading: true,
    error: null,
  });

  const fetchConfig = useCallback(async () => {
    try {
      const [cfgRes, histRes] = await Promise.all([
        fetch("/v1/kernel/config"),
        fetch("/v1/kernel/history"),
      ]);
      const cfg = await cfgRes.json();
      const hist = await histRes.json();
      setState((s) => ({
        ...s,
        activeConfig: cfg.active_config ?? null,
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
    void fetchConfig();
  }, [fetchConfig]);

  const applyShift = useCallback(
    async (config: Partial<ShiftConfig>, operatorKey: string) => {
      try {
        const res = await fetch("/v1/kernel/shift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...config, operator_key: operatorKey }),
        });
        const data = await res.json();
        if (!data.error) void fetchConfig();
        return data;
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchConfig]
  );

  const rollback = useCallback(
    async (n: number, operatorKey: string) => {
      try {
        const res = await fetch("/v1/kernel/rollback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ n, operator_key: operatorKey }),
        });
        const data = await res.json();
        if (!data.error) void fetchConfig();
        return data;
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchConfig]
  );

  return { ...state, fetchConfig, applyShift, rollback };
}
