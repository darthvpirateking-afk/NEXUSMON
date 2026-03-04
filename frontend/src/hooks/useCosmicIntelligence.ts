import { useState, useCallback } from "react";

export interface CosmicQueryResponse {
  content: string;
  scale: string;
  mode: string;
  artifact_id: string;
  render_url: string;
  tokens_used: number;
  reasoning_depth: string;
}

export interface MultiScaleResponse {
  prompt: string;
  scales_queried: string[];
  responses: CosmicQueryResponse[];
  synthesis: string;
  artifact_id: string;
  total_tokens: number;
}

export interface TimelineResponse {
  subject: string;
  start_year: number;
  end_year: number;
  events: { year: number; event: string }[];
  artifact_id: string;
  render_url: string;
  tokens_used: number;
}

export interface WorldSpaceEntry {
  entry_id: string;
  subject: string;
  scale: string;
  content: string;
  connections: string[];
  timestamp: string;
  operator: string;
  tags: string[];
  depth: string;
}

export interface WorldSpaceGraph {
  nodes: { id: string; label: string; scale: string; depth: string; connection_count: number }[];
  edges: { entry_a: string; entry_b: string; relationship: string }[];
  node_count: number;
  edge_count: number;
}

// ---------------------------------------------------------------------------
// useCosmicQuery
// ---------------------------------------------------------------------------

interface CosmicQueryState {
  response: CosmicQueryResponse | null;
  loading: boolean;
  error: string | null;
}

export function useCosmicQuery() {
  const [state, setState] = useState<CosmicQueryState>({
    response: null,
    loading: false,
    error: null,
  });

  const query = useCallback(async (prompt: string, scale: string, mode: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/v1/intelligence/cosmic/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scale, mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({ response: data.response, loading: false, error: null });
      } else {
        setState({ response: null, loading: false, error: data.error ?? "Unknown error" });
      }
    } catch (err) {
      setState({ response: null, loading: false, error: String(err) });
    }
  }, []);

  return { ...state, query };
}

// ---------------------------------------------------------------------------
// useDeepQuery
// ---------------------------------------------------------------------------

interface DeepQueryState {
  response: MultiScaleResponse | null;
  loading: boolean;
  error: string | null;
}

export function useDeepQuery() {
  const [state, setState] = useState<DeepQueryState>({
    response: null,
    loading: false,
    error: null,
  });

  const deepQuery = useCallback(async (prompt: string, scales: string[], mode: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/v1/intelligence/cosmic/deep-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scales, mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({ response: data.response, loading: false, error: null });
      } else {
        setState({ response: null, loading: false, error: data.error ?? "Unknown error" });
      }
    } catch (err) {
      setState({ response: null, loading: false, error: String(err) });
    }
  }, []);

  return { ...state, deepQuery };
}

// ---------------------------------------------------------------------------
// useTimeline
// ---------------------------------------------------------------------------

interface TimelineState {
  result: TimelineResponse | null;
  loading: boolean;
  error: string | null;
}

export function useTimeline() {
  const [state, setState] = useState<TimelineState>({
    result: null,
    loading: false,
    error: null,
  });

  const generateTimeline = useCallback(async (subject: string, startYear: number, endYear: number) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/v1/intelligence/cosmic/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, start_year: startYear, end_year: endYear }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({ result: data.timeline, loading: false, error: null });
      } else {
        setState({ result: null, loading: false, error: data.error ?? "Unknown error" });
      }
    } catch (err) {
      setState({ result: null, loading: false, error: String(err) });
    }
  }, []);

  return { ...state, generateTimeline };
}

// ---------------------------------------------------------------------------
// useWorldSpace
// ---------------------------------------------------------------------------

interface WorldSpaceState {
  graph: WorldSpaceGraph | null;
  searchResults: WorldSpaceEntry[];
  loading: boolean;
  error: string | null;
}

export function useWorldSpace() {
  const [state, setState] = useState<WorldSpaceState>({
    graph: null,
    searchResults: [],
    loading: false,
    error: null,
  });

  const fetchMap = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/v1/worldspace/map");
      const data = await res.json();
      if (data.ok) {
        setState((s) => ({ ...s, graph: data.graph, loading: false, error: null }));
      }
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: String(err) }));
    }
  }, []);

  const search = useCallback(async (query: string, scale?: string) => {
    try {
      const params = new URLSearchParams({ q: query });
      if (scale) params.set("scale", scale);
      const res = await fetch(`/v1/worldspace/search?${params}`);
      const data = await res.json();
      if (data.ok) {
        setState((s) => ({ ...s, searchResults: data.results }));
      }
    } catch (err) {
      setState((s) => ({ ...s, error: String(err) }));
    }
  }, []);

  const addEntry = useCallback(async (entry: Partial<WorldSpaceEntry>) => {
    try {
      await fetch("/v1/worldspace/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch (_) { /* silent */ }
  }, []);

  return { ...state, fetchMap, search, addEntry };
}
