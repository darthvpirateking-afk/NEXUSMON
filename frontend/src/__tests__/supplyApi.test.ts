import { afterEach, describe, expect, test, vi } from "vitest";
import { supplyApi } from "../api/supply";

const originalFetch = globalThis.fetch;

function mockFetchOnce(payload: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => payload,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  globalThis.fetch = originalFetch;
});

describe("supplyApi", () => {
  test("reads the verified supply network route", async () => {
    const payload = {
      status: "ok",
      generated_at: "2026-03-07T00:00:00Z",
      default_tier: "cortex",
      swarm_tier: "reflex",
      offline_tier: "fallback",
      providers: [
        {
          provider: "openai",
          model: "gpt-4o",
          tier: "cortex",
          configured: true,
          enabled: true,
          routed_modes: ["strategic"],
          health: "healthy",
          circuit_open: false,
          failures: 0,
          latency_ms: 0,
          estimated_cost_per_1k: 0.03,
          compliance: "standard",
          billing_integrity: "tracked",
          score: 0.91,
          source: "runtime",
          notes: [],
        },
      ],
      billing: {
        global_tokens_used: 120,
        global_max_tokens: 4000,
        per_agent_max_tokens: 2000,
        per_call_max_tokens: 400,
        tracked_agents: 2,
        tracked_models: 1,
        drift_detected: false,
      },
      mode_table: { strategic: "cortex", combat: "reflex", guardian: "blocked" },
      routing_preview: { strategic: "openai/gpt-4o", combat: "groq/llama", offline: "ollama/phi" },
      raw_bridge: {},
    };

    const fetchMock = mockFetchOnce(payload);
    const network = await supplyApi.network();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/supply\/network$/),
      expect.any(Object),
    );
    expect(network.status).toBe("ok");
    expect(network.providers).toHaveLength(1);
    expect(network.routing_preview.strategic).toBe("openai/gpt-4o");
  });

  test("handles empty providers gracefully", async () => {
    mockFetchOnce({
      status: "degraded",
      generated_at: "2026-03-07T00:00:00Z",
      default_tier: "cortex",
      swarm_tier: "reflex",
      offline_tier: "fallback",
      providers: [],
      billing: null,
      mode_table: {},
      routing_preview: {},
      raw_bridge: {},
    });
    const network = await supplyApi.network();
    expect(network.providers).toHaveLength(0);
    expect(network.status).toBe("degraded");
  });

  test("rejects when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await expect(supplyApi.network()).rejects.toBeTruthy();
  });
});