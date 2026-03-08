export interface BondMemoryEntry {
  kind: string;
  summary: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface BondConversationEntry {
  role: string;
  content: string;
  timestamp: string;
}

export interface BondStateSnapshot {
  operator_id: string;
  operator_name: string;
  mood: string;
  form: string;
  resonance: number;
  voice_traits: string[];
  return_feeling: string;
  last_seen_at: string | null;
  generated_at: string;
}

export interface BondStatusResponse {
  status: string;
  operator_id: string;
  operator_name: string;
  generated_at: string;
  absence_seconds: number;
  absence_label: string;
  unfinished_count: number;
  unfinished_missions: Array<Record<string, unknown>>;
  memory_excerpt: BondMemoryEntry[];
  conversation_excerpt: BondConversationEntry[];
  evolution: Record<string, unknown>;
  state: BondStateSnapshot;
  reply?: string | null;
  error?: string | null;
  model_used?: string | null;
  provider?: string | null;
  tokens_used?: number;
  latency_ms?: number;
}