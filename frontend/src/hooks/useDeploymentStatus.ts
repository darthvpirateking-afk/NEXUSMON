import { useCallback, useEffect, useState } from "react";
import { deploymentApi, type DeploymentStatusResponse } from "../api/deployment";

interface DeploymentStatusState {
  status: DeploymentStatusResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: DeploymentStatusState = {
  status: null,
  loading: false,
  error: null,
};

export function useDeploymentStatus() {
  const [state, setState] = useState<DeploymentStatusState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const status = await deploymentApi.status();
      setState({ status, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load deployment readiness",
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