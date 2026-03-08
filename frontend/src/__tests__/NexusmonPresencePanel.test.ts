import { describe, expect, test } from "vitest";
import { buildPresenceData } from "../components/NexusmonPresencePanel";

describe("NexusmonPresencePanel", () => {
  test("keeps real returned values when bond and evolution APIs succeed", () => {
    const data = buildPresenceData({
      evolution: {
        stage: "MONARCH_SHELL",
        visual_state: "monarch-shell",
        xp: 2400,
        next_threshold: 5000,
        resonance: 0.82,
      },
      bond: {
        greeting: "Systems aligned.",
        sessions: 7,
        mood: "VIGILANT",
        bond_depth: 74,
        absence_seconds: 180,
      },
      evolutionAvailable: true,
      bondAvailable: true,
    });

    expect(data.degraded).toBe(false);
    expect(data.form).toBe("MONARCH SHELL");
    expect(data.rank).toBe("MONARCH_SHELL");
    expect(data.xp).toBe(2400);
    expect(data.xpNext).toBe(5000);
    expect(data.sessions).toBe(7);
    expect(data.mood).toBe("VIGILANT");
    expect(data.greeting).toBe("Systems aligned.");
    expect(data.bondDepth).toBe(74);
    expect(data.absenceSeconds).toBe(180);
  });

  test("returns explicit degraded state instead of synthetic live-looking defaults when feeds fail", () => {
    const data = buildPresenceData({
      evolution: null,
      bond: null,
      evolutionAvailable: false,
      bondAvailable: false,
    });

    expect(data.degraded).toBe(true);
    expect(data.form).toBeNull();
    expect(data.rank).toBeNull();
    expect(data.xp).toBeNull();
    expect(data.xpNext).toBeNull();
    expect(data.resonance).toBeNull();
    expect(data.sessions).toBeNull();
    expect(data.mood).toBeNull();
    expect(data.bondDepth).toBeNull();
    expect(data.absenceSeconds).toBeNull();
    expect(data.greeting).toBe("Live bond and evolution feeds are unavailable.");
  });

  test("uses bond.state.resonance as fallback when evolution feed is down", () => {
    const data = buildPresenceData({
      evolution: null,
      bond: { greeting: "Systems nominal.", state: { resonance: 0.71 } },
      evolutionAvailable: false,
      bondAvailable: true,
    });

    expect(data.degraded).toBe(true);
    expect(data.resonance).toBe(0.71);
    expect(data.form).toBeNull();
    expect(data.rank).toBeNull();
    expect(data.xp).toBeNull();
    expect(data.greeting).toBe("Evolution feed unavailable. Presence is rendering with partial data.");
  });

  test("returns null bond fields with explicit degradation message when only bond is down", () => {
    const data = buildPresenceData({
      evolution: { stage: "ORIGIN", visual_state: "origin", xp: 100, next_threshold: 500, resonance: 0.55 },
      bond: null,
      evolutionAvailable: true,
      bondAvailable: false,
    });

    expect(data.degraded).toBe(true);
    expect(data.rank).toBe("ORIGIN");
    expect(data.xp).toBe(100);
    expect(data.resonance).toBe(0.55);
    expect(data.sessions).toBeNull();
    expect(data.mood).toBeNull();
    expect(data.bondDepth).toBeNull();
    expect(data.greeting).toBe("Bond feed unavailable. Presence is rendering with partial data.");
  });
});