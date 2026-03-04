import { useCallback, useEffect, useState } from "react";

export interface FusionStep {
  step_id: string;
  action: string;
  params: Record<string, unknown>;
  depends_on: string[] | null;
}

export interface StepResult {
  step_id: string;
  action: string;
  status: "complete" | "error" | "skipped";
  output: unknown;
  error: string | null;
}

export interface FusionResult {
  ok: boolean;
  fusion_id: string;
  name: string;
  status: "complete" | "partial" | "error";
  step_results: StepResult[];
  created_at: string;
  completed_at: string;
  error?: string;
}

export interface FusionPreset {
  name: string;
  description: string;
  steps: FusionStep[];
}

interface CommandFusionState {
  history: FusionResult[];
  presets: Record<string, FusionPreset>;
  executing: boolean;
  lastResult: FusionResult | null;
  error: string | null;
}

export function useCommandFusion() {
  const [state, setState] = useState<CommandFusionState>({
    history: [],
    presets: {},
    executing: false,
    lastResult: null,
    error: null,
  });

  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch("/v1/fusion/presets");
      const data = await res.json();
      setState((s) => ({ ...s, presets: data.presets ?? {} }));
    } catch {
      // non-fatal
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/v1/fusion/history");
      const data = await res.json();
      setState((s) => ({ ...s, history: data.history ?? [] }));
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    void fetchPresets();
    void fetchHistory();
  }, [fetchPresets, fetchHistory]);

  const execute = useCallback(
    async (
      steps: FusionStep[],
      name: string = "unnamed",
      operatorKey: string = ""
    ) => {
      setState((s) => ({ ...s, executing: true, error: null }));
      try {
        const res = await fetch("/v1/fusion/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps, name, operator_key: operatorKey }),
        });
        const data = (await res.json()) as FusionResult & { error?: string };
        if (data.error) {
          setState((s) => ({ ...s, executing: false, error: data.error ?? null }));
        } else {
          setState((s) => ({
            ...s,
            executing: false,
            lastResult: data,
            error: null,
          }));
          void fetchHistory();
        }
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, executing: false, error: msg }));
        return null;
      }
    },
    [fetchHistory]
  );

  const executePreset = useCallback(
    async (presetName: string, operatorKey: string = "") => {
      const preset = state.presets[presetName];
      if (!preset) return { error: `Preset ${presetName} not found` };
      return execute(preset.steps as FusionStep[], preset.name, operatorKey);
    },
    [state.presets, execute]
  );

  return { ...state, fetchHistory, execute, executePreset };
}
