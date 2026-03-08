function toShortDate(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5, 10) || "--:--";
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function safeStringify(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function estimateArtifactSize(artifact) {
  const contentBytes = safeStringify(artifact?.content).length;
  const snapshotBytes = safeStringify(artifact?.input_snapshot).length;
  const totalBytes = Math.max(0, contentBytes + snapshotBytes);
  if (totalBytes >= 1024 * 1024) {
    return `${(totalBytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (totalBytes >= 1024) {
    return `${Math.max(1, Math.round(totalBytes / 1024))}KB`;
  }
  return totalBytes ? `${totalBytes}B` : "—";
}

function artifactPreview(artifact) {
  const content = safeStringify(artifact?.content).trim();
  if (!content) return "No artifact payload stored.";
  return content.length > 180 ? `${content.slice(0, 180)}…` : content;
}

function mapArtifact(artifact) {
  const createdAt = artifact?.created_at || "";
  const reviewedAt = artifact?.reviewed_at || "";
  const status = String(artifact?.status || "PENDING_REVIEW").toUpperCase();
  return {
    id: String(artifact?.id || "A-???"),
    name: String(artifact?.title || artifact?.id || "(untitled)"),
    ver: `v${artifact?.version || 1}`,
    sealed: status === "APPROVED",
    ts: toShortDate(reviewedAt || createdAt),
    size: estimateArtifactSize(artifact),
    type: String(artifact?.type || "LOG").toUpperCase(),
    status,
    missionId: artifact?.mission_id ? String(artifact.mission_id) : "—",
    taskId: artifact?.task_id ? String(artifact.task_id) : "—",
    createdAt,
    reviewedAt,
    reviewedBy: artifact?.reviewed_by ? String(artifact.reviewed_by) : "—",
    notes: artifact?.operator_notes ? String(artifact.operator_notes) : "—",
    previousVersionId: artifact?.previous_version_id ? String(artifact.previous_version_id) : "—",
    preview: artifactPreview(artifact),
  };
}

function sortArtifacts(items) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.reviewedAt || left.createdAt || "") || 0;
    const rightTime = Date.parse(right.reviewedAt || right.createdAt || "") || 0;
    return rightTime - leftTime;
  });
}

async function fetchJson(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchCockpitArtifacts() {
  const [artifactsResult, statsResult] = await Promise.allSettled([
    fetchJson("/v1/vault/artifacts?limit=50"),
    fetchJson("/v1/vault/artifacts/stats"),
  ]);

  const artifacts =
    artifactsResult.status === "fulfilled"
      ? sortArtifacts((artifactsResult.value?.artifacts || []).map(mapArtifact))
      : [];
  const stats =
    statsResult.status === "fulfilled"
      ? {
          total: Number(statsResult.value?.total || 0),
          pendingReview: Number(statsResult.value?.pending_review || 0),
          byStatus: statsResult.value?.by_status || {},
          byType: statsResult.value?.by_type || {},
        }
      : null;

  if (!artifacts.length && artifactsResult.status === "rejected") {
    throw artifactsResult.reason;
  }

  return { artifacts, stats };
}

export async function approveCockpitArtifact(artifactId) {
  const payload = await fetchJson(`/v1/vault/artifacts/${artifactId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return mapArtifact(payload?.artifact || {});
}

export async function rejectCockpitArtifact(artifactId) {
  const payload = await fetchJson(`/v1/vault/artifacts/${artifactId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return mapArtifact(payload?.artifact || {});
}