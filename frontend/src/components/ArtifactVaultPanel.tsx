import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useArtifactVault } from "../hooks/useArtifactVault";
import type { Artifact, ArtifactStatus } from "../api/artifacts";

const STATUS_COLOR: Record<ArtifactStatus, string> = {
  PENDING_REVIEW: colors.warning,
  APPROVED: colors.running,
  REJECTED: colors.error,
  ARCHIVED: colors.textSecondary,
};

const STATUS_FILTERS: { label: string; value: ArtifactStatus | undefined }[] =
  [
    { label: "All", value: undefined },
    { label: "Pending", value: "PENDING_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Archived", value: "ARCHIVED" },
  ];

export function ArtifactVaultPanel() {
  const [filter, setFilter] = useState<ArtifactStatus | undefined>(undefined);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const { artifacts, stats, loading, error, actionError, refresh, approve, reject } =
    useArtifactVault(filter);

  useEffect(() => {
    if (!artifacts.length) {
      setSelectedArtifactId(null);
      return;
    }

    if (!selectedArtifactId || !artifacts.some((artifact) => artifact.id === selectedArtifactId)) {
      setSelectedArtifactId(artifacts[0].id);
    }
  }, [artifacts, selectedArtifactId]);

  const selectedArtifact = useMemo(
    () => artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? null,
    [artifacts, selectedArtifactId],
  );

  return (
    <section style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleGroup}>
            <span style={styles.eyebrow}>Artifact Rail</span>
            <h2 style={styles.title}>Backend Artifact Vault</h2>
          </div>
          <p style={styles.subtitle}>
            Artifact rows render from /api/artifacts. Review actions still flow through the governed vault commands.
          </p>
          {stats && (
            <div style={styles.statRow}>
              <StatBadge
                label="Total"
                value={stats.total}
                color={colors.primaryAccent}
              />
              <StatBadge
                label="Pending"
                value={stats.pending_review}
                color={colors.warning}
              />
              <StatBadge
                label="Approved"
                value={stats.by_status["APPROVED"] ?? 0}
                color={colors.running}
              />
              <StatBadge
                label="Rejected"
                value={stats.by_status["REJECTED"] ?? 0}
                color={colors.error}
              />
            </div>
          )}
        </div>
        <button
          style={styles.refreshBtn}
          onClick={() => void refresh()}
          disabled={loading}
          title="Refresh"
        >
          {loading ? "…" : "↺"}
        </button>
      </div>

      {/* Filter tabs */}
      <div style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            style={{
              ...styles.filterBtn,
              background:
                filter === f.value
                  ? `${colors.primaryAccent}22`
                  : "transparent",
              color:
                filter === f.value ? colors.primaryAccent : colors.textSecondary,
              borderColor:
                filter === f.value ? colors.primaryAccent : colors.borderColor,
            }}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p style={styles.errorText}>{error}</p>}
      {actionError && (
        <p style={{ ...styles.errorText, color: colors.warning }}>
          Action failed: {actionError}
        </p>
      )}

      {/* Artifact list */}
      <div style={styles.contentGrid}>
        <div style={styles.list}>
          {artifacts.length === 0 && !loading && (
            <p style={styles.empty}>No artifacts found.</p>
          )}
          {artifacts.map((artifact) => {
            const active = artifact.id === selectedArtifactId;
            return (
              <div
                key={artifact.id}
                style={{
                  ...styles.row,
                  borderColor: active ? `${STATUS_COLOR[artifact.status]}66` : colors.borderColor,
                  boxShadow: active ? shadows.glow(STATUS_COLOR[artifact.status]) : "none",
                  background: active ? `${STATUS_COLOR[artifact.status]}12` : "#080d18",
                }}
                onClick={() => setSelectedArtifactId(artifact.id)}
              >
                <div style={styles.rowLeft}>
                  <span style={styles.artifactType}>{artifact.type}</span>
                  <span style={styles.artifactTitle}>{artifact.title}</span>
                  {artifact.mission_id && (
                    <span style={styles.missionTag}>
                      mission:{artifact.mission_id.slice(0, 8)}
                    </span>
                  )}
                  {artifact.version > 1 && (
                    <span style={{ ...styles.missionTag, color: colors.secondaryAccent }}>
                      v{artifact.version}
                    </span>
                  )}
                </div>
                <div style={styles.rowRight}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: STATUS_COLOR[artifact.status],
                      borderColor: STATUS_COLOR[artifact.status],
                    }}
                  >
                    {artifact.status.replace("_", " ")}
                  </span>
                  {artifact.status === "PENDING_REVIEW" && (
                    <>
                      <button
                        style={{ ...styles.actionBtn, color: colors.running }}
                        onClick={(event) => {
                          event.stopPropagation();
                          void approve(artifact.id);
                        }}
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button
                        style={{ ...styles.actionBtn, color: colors.error }}
                        onClick={(event) => {
                          event.stopPropagation();
                          void reject(artifact.id);
                        }}
                        title="Reject"
                      >
                        ✗
                      </button>
                    </>
                  )}
                  <span style={styles.ts}>
                    {new Date(artifact.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.detailPane}>
          {selectedArtifact ? (
            <ArtifactDetail artifact={selectedArtifact} />
          ) : (
            <p style={styles.empty}>Select an artifact to inspect the backend record.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function formatArtifactTime(value: string): string {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

const PREVIEW_CHAR_LIMIT = 2000;
const PREVIEW_TRUNCATION_NOTICE = "\n\n[Preview truncated — payload exceeds display limit]";

export function artifactPreview(content: Artifact["content"]): string {
  let raw: string;
  if (typeof content === "string") {
    raw = content;
  } else {
    try {
      raw = JSON.stringify(content, null, 2);
    } catch {
      raw = String(content);
    }
  }
  if (raw.length > PREVIEW_CHAR_LIMIT) {
    return raw.slice(0, PREVIEW_CHAR_LIMIT) + PREVIEW_TRUNCATION_NOTICE;
  }
  return raw;
}

function ArtifactDetail({ artifact }: { artifact: Artifact }) {
  const preview = artifactPreview(artifact.content);

  return (
    <div style={styles.detailCard}>
      <div style={styles.detailHeader}>
        <div style={styles.detailTitleGroup}>
          <span style={styles.detailEyebrow}>Artifact Record</span>
          <h3 style={styles.detailTitle}>{artifact.title}</h3>
          <span style={styles.detailId}>{artifact.id}</span>
        </div>
        <span
          style={{
            ...styles.statusBadge,
            color: STATUS_COLOR[artifact.status],
            borderColor: STATUS_COLOR[artifact.status],
          }}
        >
          {artifact.status.replace("_", " ")}
        </span>
      </div>

      <div style={styles.detailMetaGrid}>
        <DetailMeta label="Type" value={artifact.type} />
        <DetailMeta label="Mission" value={artifact.mission_id ?? "-"} />
        <DetailMeta label="Task" value={artifact.task_id || "-"} />
        <DetailMeta label="Version" value={`v${artifact.version}`} />
        <DetailMeta label="Created" value={formatArtifactTime(artifact.created_at)} />
        <DetailMeta label="Reviewed" value={formatArtifactTime(artifact.reviewed_at)} />
        <DetailMeta label="Reviewed By" value={artifact.reviewed_by || "-"} />
        <DetailMeta label="Previous Version" value={artifact.previous_version_id || "-"} />
      </div>

      <div style={styles.notesBlock}>
        <span style={styles.detailEyebrow}>Operator Notes</span>
        <p style={styles.notesText}>{artifact.operator_notes || "No operator notes recorded."}</p>
      </div>

      <div style={styles.previewBlock}>
        <span style={styles.detailEyebrow}>Payload Preview</span>
        <pre style={styles.previewText}>{preview || "No artifact payload stored."}</pre>
      </div>
    </div>
  );
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailMetaBox}>
      <span style={styles.detailMetaLabel}>{label}</span>
      <span style={styles.detailMetaValue}>{value}</span>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span
      style={{
        padding: `2px ${spacing.sm}`,
        borderRadius: radii.full,
        border: `1px solid ${color}44`,
        background: `${color}12`,
        color,
        fontSize: typography.fontSizeSm,
        fontFamily: typography.fontFamily,
        fontWeight: typography.fontWeightBold,
      }}
    >
      {label}: {value}
    </span>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: colors.cardBg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    display: "grid",
    gap: spacing.md,
    boxShadow: shadows.card,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  titleGroup: {
    display: "grid",
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.secondaryAccent,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeXl,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    margin: 0,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    lineHeight: 1.5,
    maxWidth: "52ch",
  },
  statRow: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  refreshBtn: {
    background: "transparent",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.primaryAccent,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontSize: "1.1rem",
    padding: `${spacing.xs} ${spacing.sm}`,
    minHeight: 36,
    minWidth: 36,
  },
  filterRow: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: `${spacing.xs} ${spacing.sm}`,
    border: "1px solid",
    borderRadius: radii.full,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
    transition: "all 0.15s",
    minHeight: 30,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.9fr)",
    gap: spacing.md,
    minHeight: 0,
  },
  list: {
    display: "grid",
    gap: spacing.xs,
    maxHeight: 480,
    overflowY: "auto",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    background: "#080d18",
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    flexWrap: "wrap",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  rowRight: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  artifactType: {
    color: colors.secondaryAccent,
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: "monospace",
    letterSpacing: "0.06em",
    background: `${colors.secondaryAccent}18`,
    padding: `1px ${spacing.xs}`,
    borderRadius: radii.sm,
    flexShrink: 0,
  },
  artifactTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  missionTag: {
    color: colors.textSecondary,
    fontSize: "0.68rem",
    fontFamily: "monospace",
    flexShrink: 0,
  },
  statusBadge: {
    padding: `1px ${spacing.xs}`,
    border: "1px solid",
    borderRadius: radii.full,
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  actionBtn: {
    background: "transparent",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.sm,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontSize: "0.8rem",
    padding: `2px ${spacing.xs}`,
    minWidth: 26,
    minHeight: 26,
    transition: "opacity 0.15s",
  },
  ts: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: "monospace",
    flexShrink: 0,
  },
  empty: {
    margin: 0,
    color: colors.textSecondary,
    textAlign: "center",
    padding: spacing.lg,
    fontFamily: typography.fontFamily,
  },
  detailPane: {
    minHeight: 0,
  },
  detailCard: {
    display: "grid",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `${colors.bg}BF`,
    height: "100%",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  detailTitleGroup: {
    display: "grid",
    gap: spacing.xs,
  },
  detailEyebrow: {
    color: colors.secondaryAccent,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  detailTitle: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeLg,
    fontFamily: typography.fontFamily,
  },
  detailId: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  detailMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: spacing.sm,
  },
  detailMetaBox: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: colors.cardBg,
  },
  detailMetaLabel: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  detailMetaValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    wordBreak: "break-word",
  },
  notesBlock: {
    display: "grid",
    gap: spacing.xs,
  },
  notesText: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
  },
  previewBlock: {
    display: "grid",
    gap: spacing.xs,
    minHeight: 0,
  },
  previewText: {
    margin: 0,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: "#060a12",
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 240,
    overflowY: "auto",
  },
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
};
