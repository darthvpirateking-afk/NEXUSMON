import { useCallback, useEffect, useState } from "react";
import { telemetryApi, type TelemetrySummaryResponse } from "../api/telemetry";

interface TelemetrySummaryState {
  summary: TelemetrySummaryResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: TelemetrySummaryState = {
  summary: null,
  loading: false,
  error: null,
};

export function useTelemetrySummary() {
  const [state, setState] = useState<TelemetrySummaryState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const summary = await telemetryApi.summary();
      setState({ summary, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load telemetry summary",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...state, refresh };
}