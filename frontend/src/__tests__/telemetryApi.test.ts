import { afterEach, describe, expect, test, vi } from "vitest";
import { telemetryApi } from "../api/telemetry";

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

describe("telemetryApi", () => {
  test("reads the canonical telemetry summary route", async () => {
    const payload = {
      ok: true,
      timestamp: "2026-03-08T00:00:00Z",
      status: "ok",
      degraded_feeds: [],
      health: { available: true, status: "ok", subsystems: { api: "ok" }, healthy_count: 1, degraded_count: 0 },
      bridge: {
        available: true,
        status: "ok",
        providers: ["openai/gpt-4o"],
        provider_count: 1,
        primary_provider: "openai/gpt-4o",
        mode_table: { strategic: "cortex", combat: "reflex", guardian: "blocked" },
      },
      missions: { available: true, total: 2, execution_backed: 1, queued: 1, running: 0, read_only: 1 },
      evolution: { available: true, stage: "MONARCH_SHELL", xp: 2400, next_threshold: 5000, resonance: 0.82, visual_state: "monarch-shell" },
      bond: { available: true, mood: "VIGILANT", form: "monarch-shell", resonance: 0.74, last_seen_at: null, unfinished_count: 1, memory_count: 2, conversation_count: 3 },
    };

    const fetchMock = mockFetchOnce(payload);
    const summary = await telemetryApi.summary();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/telemetry\/summary$/),
      expect.any(Object),
    );
    expect(summary.status).toBe("ok");
    expect(summary.bridge.primary_provider).toBe("openai/gpt-4o");
  });

  test("rejects when the telemetry route is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await expect(telemetryApi.summary()).rejects.toBeTruthy();
  });
});