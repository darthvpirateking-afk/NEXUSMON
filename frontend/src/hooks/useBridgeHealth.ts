import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

export interface CircuitState {
  failures: number;
  open: boolean;
  opened_at: number | null;
}

export interface BridgeHealthData {
  status: "ok" | "degraded" | string;
  providers: string[];
  circuit_breaker: Record<string, CircuitState>;
  budget: Record<string, unknown>;
  mode_table: Record<string, string>;
}

interface UseBridgeHealthResult {
  data: BridgeHealthData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBridgeHealth(intervalMs = 10_000): UseBridgeHealthResult {
  const [data, setData] = useState<BridgeHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const payload = await apiGet<BridgeHealthData>("/api/health/bridge");
      setData(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bridge unreachable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, refresh]);

  return { data, loading, error, refresh };
}
