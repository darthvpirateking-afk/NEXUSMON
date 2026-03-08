import { useCallback, useEffect, useState } from "react";
import { supplyApi, type SupplyNetworkResponse } from "../api/supply";

interface SupplyNetworkState {
  network: SupplyNetworkResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: SupplyNetworkState = {
  network: null,
  loading: false,
  error: null,
};

export function useSupplyNetwork() {
  const [state, setState] = useState<SupplyNetworkState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const network = await supplyApi.network();
      setState({ network, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load supply network",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...state, refresh };
}