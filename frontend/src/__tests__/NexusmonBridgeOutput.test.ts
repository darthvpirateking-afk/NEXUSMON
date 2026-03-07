import { describe, expect, test } from "vitest";
import { buildBridgeOutputView } from "../components/NexusmonBridgeOutput";

describe("NexusmonBridgeOutput", () => {
  test("keeps backend-provided output renderable when present", () => {
    const view = buildBridgeOutputView({
      output: "Backend mission transcript",
      mode: "strategic",
      backendBacked: true,
    });

    expect(view.hasOutput).toBe(true);
    expect(view.sourceLabel).toBe("BACKEND-PROVIDED");
    expect(view.statusLabel).toBe("SESSION RELAY");
    expect(view.detail).toContain("Backend-provided output");
  });

  test("renders explicit truthful unavailable state when backend-backed output is missing", () => {
    const view = buildBridgeOutputView({
      output: null,
      mode: null,
      backendBacked: false,
    });

    expect(view.hasOutput).toBe(false);
    expect(view.sourceLabel).toBe("UNAVAILABLE");
    expect(view.statusLabel).toBe("SESSION-LOCAL ONLY");
    expect(view.emptyTitle).toBe("No backend bridge output");
    expect(view.emptyBody).toContain("Unavailable from the backend");
  });
});