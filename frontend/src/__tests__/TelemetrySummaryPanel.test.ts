import { describe, expect, test } from "vitest";
import { buildTelemetrySummaryView } from "../components/TelemetrySummaryPanel";

describe("TelemetrySummaryPanel", () => {
  test("builds a truthful summary view when all feeds are available", () => {
    const view = buildTelemetrySummaryView({
      ok: true,
      timestamp: "2026-03-08T00:00:00Z",
      status: "ok",
      degraded_feeds: [],
      health: { available: true, status: "ok", subsystems: { api: "ok", bridge: "ok" }, healthy_count: 2, degraded_count: 0 },
      bridge: {
        available: true,
        status: "ok",
        providers: ["openai/gpt-4o"],
        provider_count: 1,
        primary_provider: "openai/gpt-4o",
        mode_table: { strategic: "cortex", combat: "reflex", guardian: "blocked" },
      },
      missions: { available: true, total: 4, execution_backed: 2, queued: 1, running: 1, read_only: 2 },
      evolution: { available: true, stage: "MONARCH_SHELL", xp: 2400, next_threshold: 5000, resonance: 0.82, visual_state: "monarch-shell" },
      bond: { available: true, mood: "VIGILANT", form: "monarch-shell", resonance: 0.74, last_seen_at: null, unfinished_count: 1, memory_count: 2, conversation_count: 3 },
    });

    expect(view).not.toBeNull();
    expect(view?.statusLabel).toBe("OK");
    expect(view?.degradedLabel).toBe("ALL FEEDS VERIFIED");
    expect(view?.primaryProvider).toBe("openai/gpt-4o");
    expect(view?.missionLabel).toBe("2/4 EXECUTION-BACKED");
    expect(view?.stageLabel).toBe("MONARCH_SHELL");
    expect(view?.bondMoodLabel).toBe("VIGILANT");
  });

  test("renders degraded summary without inventing healthy state", () => {
    const view = buildTelemetrySummaryView({
      ok: true,
      timestamp: "2026-03-08T00:00:00Z",
      status: "degraded",
      degraded_feeds: ["bridge", "bond"],
      health: { available: true, status: "ok", subsystems: { api: "ok" }, healthy_count: 1, degraded_count: 0 },
      bridge: {
        available: false,
        status: "degraded",
        providers: [],
        provider_count: 0,
        primary_provider: null,
        mode_table: { strategic: "cortex", combat: "reflex", guardian: "blocked" },
        error: "offline",
      },
      missions: { available: true, total: 1, execution_backed: 0, queued: 1, running: 0, read_only: 1 },
      evolution: { available: true, stage: null, xp: null, next_threshold: null, resonance: null, visual_state: null },
      bond: { available: false, mood: null, form: null, resonance: null, last_seen_at: null, unfinished_count: 0, memory_count: 0, conversation_count: 0, error: "unavailable" },
    });

    expect(view).not.toBeNull();
    expect(view?.statusLabel).toBe("DEGRADED");
    expect(view?.degradedLabel).toBe("2 DEGRADED FEEDS");
    expect(view?.primaryProvider).toBe("UNRESOLVED");
    expect(view?.bondMoodLabel).toBe("UNAVAILABLE");
  });

  test("returns null when summary is unavailable", () => {
    expect(buildTelemetrySummaryView(null)).toBeNull();
  });
});