import { describe, expect, test } from "vitest";
import { buildDeploymentReadinessView } from "../components/DeploymentReadinessPanel";

describe("DeploymentReadinessPanel", () => {
  test("builds a truthful view from backend deployment/mobile status", () => {
    const view = buildDeploymentReadinessView({
      ok: true,
      timestamp: "2026-03-08T00:00:00Z",
      deployment: {
        platform: "railway",
        public_url: "https://nexusmon.up.railway.app",
        has_render_yaml: false,
        has_railway_json: true,
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
        recommended_manifest: "https://nexusmon.up.railway.app/pwa/manifest.json",
        recommended_start: "https://nexusmon.up.railway.app/console",
      },
    });

    expect(view).not.toBeNull();
    expect(view?.platformLabel).toBe("RAILWAY");
    expect(view?.cloudState).toBe("CLOUD HINT DETECTED");
    expect(view?.mobileAccessLabel).toBe("ENABLED");
    expect(view?.mobilePortLabel).toBe("8000");
    expect(view?.wrapperLabel).toBe("WRAPPER READY");
    expect(view?.configLabel).toBe("CONFIG READY");
    expect(view?.sourceLabel).toBe("CONFIG.JSON");
  });

  test("returns null instead of inventing ready state when backend says not ok", () => {
    const view = buildDeploymentReadinessView(null);
    expect(view).toBeNull();
  });

  test("renders explicit disabled and missing labels when mobile readiness is incomplete", () => {
    const view = buildDeploymentReadinessView({
      ok: true,
      timestamp: "2026-03-08T00:00:00Z",
      deployment: {
        platform: "local",
        public_url: "http://127.0.0.1:8000",
        has_render_yaml: true,
        has_railway_json: true,
        is_cloud_hint: false,
      },
      mobile: {
        mobile_access: {
          enabled: false,
          port: null,
          source: "missing",
        },
        has_capacitor_wrapper: false,
        has_capacitor_config: false,
        recommended_manifest: "http://127.0.0.1:8000/pwa/manifest.json",
        recommended_start: "http://127.0.0.1:8000/console",
      },
    });

    expect(view).not.toBeNull();
    expect(view?.cloudState).toBe("LOCAL OR SELF-HOSTED");
    expect(view?.mobileAccessLabel).toBe("DISABLED");
    expect(view?.mobilePortLabel).toBe("UNSET");
    expect(view?.wrapperLabel).toBe("WRAPPER MISSING");
    expect(view?.configLabel).toBe("CONFIG MISSING");
    expect(view?.sourceLabel).toBe("MISSING");
  });
});