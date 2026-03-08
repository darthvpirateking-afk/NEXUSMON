import { type CSSProperties } from "react";
import { type TelemetrySummaryResponse } from "../api/telemetry";
import { useTelemetrySummary } from "../hooks/useTelemetrySummary";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";

interface TelemetrySummaryView {
  statusLabel: string;
  degradedLabel: string;
  primaryProvider: string;
  missionLabel: string;
  stageLabel: string;
  bondMoodLabel: string;
  subsystemLabel: string;
  lastUpdatedLabel: string;
}

export function buildTelemetrySummaryView(
  summary: TelemetrySummaryResponse | null,
): TelemetrySummaryView | null {
  if (!summary?.ok) {
    return null;
  }

  const timestamp = new Date(summary.timestamp);
  const lastUpdatedLabel = Number.isNaN(timestamp.getTime())
    ? summary.timestamp
    : timestamp.toLocaleTimeString();

  return {
    statusLabel: summary.status.toUpperCase(),
    degradedLabel:
      summary.degraded_feeds.length === 0
        ? "ALL FEEDS VERIFIED"
        : `${summary.degraded_feeds.length} DEGRADED FEEDS`,
    primaryProvider: summary.bridge.primary_provider ?? "UNRESOLVED",
    missionLabel: `${summary.missions.execution_backed}/${summary.missions.total} EXECUTION-BACKED`,
    stageLabel: summary.evolution.stage ?? "UNAVAILABLE",
    bondMoodLabel: summary.bond.mood ?? "UNAVAILABLE",
    subsystemLabel: `${summary.health.healthy_count} OK / ${summary.health.degraded_count} DEGRADED`,
    lastUpdatedLabel,
  };
}

function StatusChip({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      style={{
        ...styles.statusChip,
        color: tone,
        borderColor: `${tone}66`,
        background: `${tone}14`,
      }}
    >
      {label}
    </span>
  );
}

function StatRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={styles.statRow}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: tone ?? colors.textPrimary }}>{value}</span>
    </div>
  );
}

export function TelemetrySummaryPanel() {
  const { summary, loading, error, refresh } = useTelemetrySummary();
  const view = buildTelemetrySummaryView(summary);
  const degraded = summary?.status === "degraded";

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <span style={styles.eyebrow}>Telemetry Backbone</span>
          <h2 style={styles.title}>Telemetry Summary</h2>
          <p style={styles.subtitle}>
            Canonical operator-safe summary built from truthful health, bridge, mission, evolution, and persisted bond state sources.
          </p>
        </div>
        <div style={styles.headerActions}>
          {view ? (
            <StatusChip label={view.statusLabel} tone={degraded ? colors.warning : colors.running} />
          ) : null}
          <button
            type="button"
            style={styles.refreshBtn}
            onClick={() => void refresh()}
            disabled={loading}
            title="Refresh telemetry summary"
          >
            {loading ? "…" : "↺"}
          </button>
        </div>
      </div>

      {error ? <p style={styles.errorText}>{error}</p> : null}
      {!view && !error ? <p style={styles.empty}>Telemetry summary unavailable.</p> : null}

      {view ? (
        <>
          <div style={styles.summaryCard}>
            <div style={styles.summaryTopRow}>
              <StatusChip
                label={view.degradedLabel}
                tone={degraded ? colors.warning : colors.secondaryAccent}
              />
              <span style={styles.generatedAt}>{view.lastUpdatedLabel}</span>
            </div>
            <StatRow label="Primary Bridge" value={view.primaryProvider} tone={colors.primaryAccent} />
            <StatRow label="Mission Truth" value={view.missionLabel} tone={colors.textPrimary} />
            <StatRow label="Subsystems" value={view.subsystemLabel} />
          </div>

          <div style={styles.dualGrid}>
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Evolution</span>
              </div>
              <div style={styles.sectionBody}>
                <StatRow label="Stage" value={view.stageLabel} tone={colors.secondaryAccent} />
                <StatRow label="XP" value={String(summary?.evolution.xp ?? "-")} />
                <StatRow label="Resonance" value={String(summary?.evolution.resonance ?? "-")} />
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Bond State</span>
              </div>
              <div style={styles.sectionBody}>
                <StatRow label="Mood" value={view.bondMoodLabel} tone={colors.warning} />
                <StatRow label="Unfinished" value={String(summary?.bond.unfinished_count ?? 0)} />
                <StatRow label="Memories" value={String(summary?.bond.memory_count ?? 0)} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
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
    minHeight: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  headerCopy: {
    display: "grid",
    gap: spacing.xs,
    maxWidth: "44rem",
  },
  headerActions: {
    display: "flex",
    gap: spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
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
    color: colors.textPrimary,
    fontSize: typography.fontSizeXl,
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
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
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  empty: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  summaryCard: {
    display: "grid",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background:
      "linear-gradient(180deg, rgba(3,12,18,0.96) 0%, rgba(3,8,14,0.96) 100%)",
  },
  summaryTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  generatedAt: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: spacing.md,
  },
  sectionCard: {
    display: "grid",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `${colors.bg}BF`,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  sectionBody: {
    display: "grid",
    gap: spacing.sm,
  },
  statusChip: {
    border: "1px solid",
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  statValue: {
    textAlign: "right",
    wordBreak: "break-word",
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    maxWidth: "60%",
  },
};