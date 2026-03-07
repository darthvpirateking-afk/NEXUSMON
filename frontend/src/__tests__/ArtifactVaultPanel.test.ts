import { describe, expect, test } from "vitest";
import { artifactPreview, formatArtifactTime } from "../components/ArtifactVaultPanel";

// ---------------------------------------------------------------------------
// formatArtifactTime
// ---------------------------------------------------------------------------
describe("formatArtifactTime", () => {
  test("returns hyphen placeholder for empty string", () => {
    expect(formatArtifactTime("")).toBe("-");
  });

  test("renders a valid ISO timestamp to a non-empty locale string", () => {
    const result = formatArtifactTime("2026-03-07T00:02:00Z");
    expect(result.length).toBeGreaterThan(0);
    // Must not be the raw ISO string — some locale formatting happened.
    expect(result).not.toBe("2026-03-07T00:02:00Z");
  });

  test("returns the original value when unparseable", () => {
    expect(formatArtifactTime("not-a-date")).toBe("not-a-date");
  });

  test("handles epoch zero without crashing", () => {
    // Unix 0 is a valid date — should not throw.
    const result = formatArtifactTime("1970-01-01T00:00:00Z");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// artifactPreview
// ---------------------------------------------------------------------------
describe("artifactPreview", () => {
  test("returns string content verbatim when under limit", () => {
    const result = artifactPreview("hello world");
    expect(result).toBe("hello world");
  });

  test("stringifies object content as formatted JSON", () => {
    const result = artifactPreview({ status: "ok", count: 3 });
    expect(result).toContain('"status": "ok"');
    expect(result).toContain('"count": 3');
  });

  test("stringifies nested objects without throwing", () => {
    const nested = { a: { b: { c: [1, 2, 3] } } };
    const result = artifactPreview(nested);
    expect(result).toContain('"c"');
  });

  test("truncates string content that exceeds 2000 chars", () => {
    const longString = "x".repeat(3000);
    const result = artifactPreview(longString);
    expect(result.length).toBeLessThan(3000);
    expect(result).toContain("[Preview truncated");
  });

  test("truncates serialised JSON content that exceeds 2000 chars", () => {
    // 300 keys × ~12 chars each ≈ 3600 chars of JSON
    const bigObject: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      bigObject[`key_${String(i).padStart(3, "0")}`] = i;
    }
    const result = artifactPreview(bigObject);
    expect(result).toContain("[Preview truncated");
  });

  test("preserves content under 2000 chars exactly — no truncation marker", () => {
    const borderline = "y".repeat(1999);
    const result = artifactPreview(borderline);
    expect(result).not.toContain("[Preview truncated");
    expect(result.length).toBe(1999);
  });

  test("handles empty string content", () => {
    const result = artifactPreview("");
    expect(result).toBe("");
  });

  test("handles null-ish unknown content gracefully", () => {
    // `content` is typed as `unknown` — callers may send null at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = artifactPreview(null as any);
    expect(typeof result).toBe("string");
  });
});
