import { afterEach, describe, expect, test, vi } from "vitest";
import { artifactsApi } from "../api/artifacts";

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

describe("artifactsApi", () => {
  test("derives filtered list and stats from /api/artifacts", async () => {
    const artifacts = [
      {
        id: "art-1",
        version: 1,
        mission_id: "mission-a",
        task_id: "task-a",
        type: "REPORT",
        title: "Newest pending report",
        content: { ok: true },
        input_snapshot: {},
        status: "PENDING_REVIEW",
        operator_notes: "",
        created_at: "2026-03-07T00:02:00Z",
        reviewed_at: "",
        reviewed_by: "",
        previous_version_id: "",
      },
      {
        id: "art-2",
        version: 1,
        mission_id: "mission-b",
        task_id: "task-b",
        type: "LOG",
        title: "Approved log",
        content: { ok: true },
        input_snapshot: {},
        status: "APPROVED",
        operator_notes: "LGTM",
        created_at: "2026-03-07T00:01:00Z",
        reviewed_at: "2026-03-07T00:03:00Z",
        reviewed_by: "operator",
        previous_version_id: "",
      },
    ];

    const fetchMock = mockFetchOnce({ artifacts, count: artifacts.length });
    const list = await artifactsApi.list({ status: "PENDING_REVIEW", limit: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/artifacts$/),
      expect.any(Object),
    );
    expect(list.total).toBe(1);
    expect(list.artifacts).toHaveLength(1);
    expect(list.artifacts[0].id).toBe("art-1");

    mockFetchOnce({ artifacts, count: artifacts.length });
    const stats = await artifactsApi.stats();
    expect(stats.total).toBe(2);
    expect(stats.pending_review).toBe(1);
    expect(stats.by_status.APPROVED).toBe(1);
    expect(stats.by_type.REPORT).toBe(1);
  });
});