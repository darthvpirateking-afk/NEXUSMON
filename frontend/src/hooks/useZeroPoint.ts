import { useCallback, useEffect, useState } from "react";

export interface OverrideEntry {
  override_id: string;
  subsystem: string;
  parameter: string;
  value: unknown;
  ttl_seconds: number;
  applied_at: string;
  expires_at: string;
  active: boolean;
}

interface ZeroPointState {
  overrides: OverrideEntry[];
  totalActive: number;
  loading: boolean;
  error: string | null;
}

export function useZeroPoint() {
  const [state, setState] = useState<ZeroPointState>({
    overrides: [],
    totalActive: 0,
    loading: true,
    error: null,
  });

  const fetchOverrides = useCallback(async () => {
    try {
      const [listRes, statusRes] = await Promise.all([
        fetch("/v1/zeropoint/overrides"),
        fetch("/v1/zeropoint/status"),
      ]);
      const list = await listRes.json();
      const status = await statusRes.json();
      setState((s) => ({
        ...s,
        overrides: list.overrides ?? [],
        totalActive: status.total_active ?? 0,
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
    void fetchOverrides();
  }, [fetchOverrides]);

  const applyOverride = useCallback(
    async (
      subsystem: string,
      parameter: string,
      value: unknown,
      operatorKey: string,
      doctrineHash: string,
      ttlSeconds: number = 3600
    ) => {
      try {
        const res = await fetch("/v1/zeropoint/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subsystem,
            parameter,
            value,
            operator_key: operatorKey,
            doctrine_hash: doctrineHash,
            ttl_seconds: ttlSeconds,
          }),
        });
        const data = await res.json();
        if (!data.error) void fetchOverrides();
        return data;
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchOverrides]
  );

  const expireOverride = useCallback(
    async (overrideId: string) => {
      try {
        const res = await fetch(`/v1/zeropoint/override/${overrideId}/expire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = await res.json();
        if (data.ok) void fetchOverrides();
        return data;
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchOverrides]
  );

  return { ...state, fetchOverrides, applyOverride, expireOverride };
}
