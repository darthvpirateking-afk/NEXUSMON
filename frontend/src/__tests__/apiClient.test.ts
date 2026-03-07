import { describe, expect, test } from "vitest";
import { resolveApiBaseUrl } from "../api/client";

describe("resolveApiBaseUrl", () => {
  test("uses same-origin proxy path for local 8000 backend during dev", () => {
    expect(
      resolveApiBaseUrl(
        "http://127.0.0.1:8000",
        "http://127.0.0.1:4173",
        true,
      ),
    ).toBe("");
  });

  test("keeps configured remote backend outside local dev proxy case", () => {
    expect(
      resolveApiBaseUrl(
        "https://nexusmon.onrender.com",
        "http://127.0.0.1:4173",
        true,
      ),
    ).toBe("https://nexusmon.onrender.com");
  });
});