import { apiGet } from "./client";

export interface SupplyProviderStatus {
  provider: string;
  model: string;
  tier: string;
  configured: boolean;
  enabled: boolean;
  routed_modes: string[];
  health: string;
  circuit_open: boolean;
  failures: number;
  latency_ms: number;
  estimated_cost_per_1k: number;
  compliance: string;
  billing_integrity: string;
  score: number;
  source: string;
  notes: string[];
}

export interface SupplyBillingSnapshot {
  global_tokens_used: number;
  global_max_tokens: number;
  per_agent_max_tokens: number;
  per_call_max_tokens: number;
  tracked_agents: number;
  tracked_models: number;
  drift_detected: boolean;
}

export interface SupplyNetworkResponse {
  status: string;
  generated_at: string;
  default_tier: string;
  swarm_tier: string;
  offline_tier: string;
  providers: SupplyProviderStatus[];
  billing: SupplyBillingSnapshot;
  mode_table: Record<string, string>;
  routing_preview: Record<string, string>;
  raw_bridge: Record<string, unknown>;
}

export const supplyApi = {
  network: () => apiGet<SupplyNetworkResponse>("/supply/network"),
};