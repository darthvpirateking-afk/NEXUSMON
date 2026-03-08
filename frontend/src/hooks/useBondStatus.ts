import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "../api/client";
import type { BondStatusResponse } from "../types/bond";

interface BondStatusState {
  bond: BondStatusResponse | null;
  loading: boolean;
  error: string | null;
}

export function useBondStatus(pollMs: number = 60000) {
  const [state, setState] = useState<BondStatusState>({
    bond: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const bond = await apiGet<BondStatusResponse>("/bond/status");
      setState({ bond, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `Bond status unavailable (${err.status}).`
          : err instanceof Error
            ? err.message
            : String(err);
      setState((current) => ({
        bond: current.bond,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = setInterval(() => void refresh(), pollMs);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pollMs, refresh]);

  return {
    ...state,
    refresh,
  };
}