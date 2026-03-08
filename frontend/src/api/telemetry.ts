import { apiGet } from "./client";

export interface TelemetryHealthSummary {
  available: boolean;
  status: string;
  subsystems: Record<string, string>;
  healthy_count: number;
  degraded_count: number;
  error?: string;
}

export interface TelemetryBridgeSummary {
  available: boolean;
  status: string;
  providers: string[];
  provider_count: number;
  primary_provider: string | null;
  circuit_breaker?: Record<string, unknown>;
  budget?: Record<string, unknown>;
  mode_table: Record<string, string>;
  error?: string;
}

export interface TelemetryMissionSummary {
  available: boolean;
  total: number;
  execution_backed: number;
  queued: number;
  running: number;
  read_only: number;
  error?: string;
}

export interface TelemetryEvolutionSummary {
  available: boolean;
  stage: string | null;
  xp: number | null;
  next_threshold: number | null;
  resonance: number | null;
  visual_state: string | null;
  error?: string;
}

export interface TelemetryBondSummary {
  available: boolean;
  mood: string | null;
  form: string | null;
  resonance: number | null;
  last_seen_at: string | null;
  unfinished_count: number;
  memory_count: number;
  conversation_count: number;
  error?: string;
}

export interface TelemetrySummaryResponse {
  ok: boolean;
  timestamp: string;
  status: string;
  degraded_feeds: string[];
  health: TelemetryHealthSummary;
  bridge: TelemetryBridgeSummary;
  missions: TelemetryMissionSummary;
  evolution: TelemetryEvolutionSummary;
  bond: TelemetryBondSummary;
}

export const telemetryApi = {
  summary: () => apiGet<TelemetrySummaryResponse>("/v1/telemetry/summary"),
};