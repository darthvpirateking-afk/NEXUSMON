import { afterEach, describe, expect, test, vi } from "vitest";
import { deploymentApi } from "../api/deployment";

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

describe("deploymentApi", () => {
  test("reads the verified deployment/mobile status route", async () => {
    const payload = {
      ok: true,
      timestamp: "2026-03-08T00:00:00Z",
      deployment: {
        platform: "render",
        public_url: "https://nexusmon.example",
        has_render_yaml: true,
        has_railway_json: false,
        is_cloud_hint: true,
      },
      mobile: {
        mobile_access: {
          enabled: true,
          port: 8000,
          source: "config.json",
        },
        has_capacitor_wrapper: true,
        has_capacitor_config: true,
        recommended_manifest: "https://nexusmon.example/pwa/manifest.json",
        recommended_start: "https://nexusmon.example/console",
      },
    };

    const fetchMock = mockFetchOnce(payload);
    const status = await deploymentApi.status();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/deployment\/mobile-status$/),
      expect.any(Object),
    );
    expect(status.ok).toBe(true);
    expect(status.deployment.platform).toBe("render");
    expect(status.mobile.mobile_access.source).toBe("config.json");
  });

  test("rejects when the deployment route is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await expect(deploymentApi.status()).rejects.toBeTruthy();
  });
});