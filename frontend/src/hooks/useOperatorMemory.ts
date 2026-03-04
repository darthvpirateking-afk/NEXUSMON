import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "../api/client";

export interface MemoryEntry {
  name: string;
  session_count: number;
  total_missions: number;
  last_seen: string;
  milestones: string[];
  operator_notes: string;
  relationship_state: string;
  created_at: string;
}

export interface OperatorLockStatus {
  bound: boolean;
  operator?: string;
  since?: string;
}

interface OperatorMemoryState {
  memory: MemoryEntry | null;
  greeting: string | null;
  loading: boolean;
  error: string | null;
  locked: boolean;
  lockStatus: OperatorLockStatus | null;
}

export function useOperatorMemory(pollMs: number = 60000) {
  const [state, setState] = useState<OperatorMemoryState>({
    memory: null,
    greeting: null,
    loading: true,
    error: null,
    locked: false,
    lockStatus: null,
  });

  const readLockStatus = useCallback(async (): Promise<OperatorLockStatus | null> => {
    try {
      return await apiGet<OperatorLockStatus>("/v1/operator/lock/status");
    } catch {
      return null;
    }
  }, []);

  const setLockedState = useCallback(async () => {
    const lockStatus = await readLockStatus();
    setState({
      memory: null,
      greeting: null,
      loading: false,
      error: "Operator lock active. Provide valid operator key.",
      locked: true,
      lockStatus,
    });
  }, [readLockStatus]);

  const fetchMemory = useCallback(async () => {
    try {
      const [mem, greet] = await Promise.all([
        apiGet<MemoryEntry & { error?: string }>("/v1/operator/memory"),
        apiGet<{ greeting?: string; error?: string }>("/v1/operator/memory/greet"),
      ]);
      if (mem.error) {
        setState((s) => ({
          ...s,
          memory: null,
          loading: false,
          error: mem.error ?? null,
          locked: false,
          lockStatus: null,
        }));
      } else {
        setState({
          memory: mem,
          greeting: greet.greeting ?? null,
          loading: false,
          error: null,
          locked: false,
          lockStatus: null,
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 204) {
        await setLockedState();
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({
        ...s,
        loading: false,
        error: msg,
        locked: false,
        lockStatus: null,
      }));
    }
  }, [setLockedState]);

  useEffect(() => {
    void fetchMemory();
    const id = setInterval(() => void fetchMemory(), pollMs);
    return () => clearInterval(id);
  }, [fetchMemory, pollMs]);

  const introduce = useCallback(
    async (name: string) => {
      try {
        const data = await apiPost<MemoryEntry & { ok?: boolean; error?: string }>(
          "/v1/operator/memory/introduce",
          { name }
        );
        if (!data.error) void fetchMemory();
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 204) {
          await setLockedState();
          return { error: "Operator lock active. Provide valid operator key." };
        }
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchMemory, setLockedState]
  );

  const addNote = useCallback(
    async (note: string) => {
      try {
        const data = await apiPost<MemoryEntry & { ok?: boolean; error?: string }>(
          "/v1/operator/memory/note",
          { note }
        );
        if (!data.error) void fetchMemory();
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 204) {
          await setLockedState();
          return { error: "Operator lock active. Provide valid operator key." };
        }
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchMemory, setLockedState]
  );

  const addMilestone = useCallback(
    async (milestone: string) => {
      try {
        const data = await apiPost<MemoryEntry & { ok?: boolean; error?: string }>(
          "/v1/operator/memory/milestone",
          { milestone }
        );
        if (!data.error) void fetchMemory();
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 204) {
          await setLockedState();
          return { error: "Operator lock active. Provide valid operator key." };
        }
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [fetchMemory, setLockedState]
  );

  return { ...state, fetchMemory, introduce, addNote, addMilestone };
}
