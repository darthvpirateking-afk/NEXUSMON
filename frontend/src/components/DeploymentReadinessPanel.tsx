import { type CSSProperties } from "react";
import { type DeploymentStatusResponse } from "../api/deployment";
import { useDeploymentStatus } from "../hooks/useDeploymentStatus";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";

interface DeploymentViewModel {
  platformLabel: string;
  publicUrl: string;
  cloudState: string;
  mobileAccessLabel: string;
  mobilePortLabel: string;
  wrapperLabel: string;
  configLabel: string;
  manifestUrl: string;
  startUrl: string;
  sourceLabel: string;
  generatedAtLabel: string;
}

export function buildDeploymentReadinessView(
  status: DeploymentStatusResponse | null,
): DeploymentViewModel | null {
  if (!status?.ok) {
    return null;
  }

  const mobileAccess = status.mobile.mobile_access;
  const generatedAt = new Date(status.timestamp);
  const generatedAtLabel = Number.isNaN(generatedAt.getTime())
    ? status.timestamp
    : generatedAt.toLocaleTimeString();

  return {
    platformLabel: status.deployment.platform.toUpperCase(),
    publicUrl: status.deployment.public_url,
    cloudState: status.deployment.is_cloud_hint ? "CLOUD HINT DETECTED" : "LOCAL OR SELF-HOSTED",
    mobileAccessLabel: mobileAccess.enabled ? "ENABLED" : "DISABLED",
    mobilePortLabel: mobileAccess.port == null ? "UNSET" : String(mobileAccess.port),
    wrapperLabel: status.mobile.has_capacitor_wrapper ? "WRAPPER READY" : "WRAPPER MISSING",
    configLabel: status.mobile.has_capacitor_config ? "CONFIG READY" : "CONFIG MISSING",
    manifestUrl: status.mobile.recommended_manifest,
    startUrl: status.mobile.recommended_start,
    sourceLabel: mobileAccess.source.toUpperCase(),
    generatedAtLabel,
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

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{ ...styles.detailValue, color: tone ?? colors.textPrimary }}>{value}</span>
    </div>
  );
}

export function DeploymentReadinessPanel() {
  const { status, loading, error, refresh } = useDeploymentStatus();
  const view = buildDeploymentReadinessView(status);

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <span style={styles.eyebrow}>Deployment Rail</span>
          <h2 style={styles.title}>Deployment Readiness</h2>
          <p style={styles.subtitle}>
            Read-only status from the existing deployment/mobile contract. This panel exposes operator-visible readiness without introducing deploy actions or synthetic telemetry.
          </p>
        </div>
        <div style={styles.headerActions}>
          {view ? <StatusChip label={view.platformLabel} tone={colors.primaryAccent} /> : null}
          <button
            type="button"
            style={styles.refreshBtn}
            onClick={() => void refresh()}
            disabled={loading}
            title="Refresh deployment readiness"
          >
            {loading ? "…" : "↺"}
          </button>
        </div>
      </div>

      {error ? <p style={styles.errorText}>{error}</p> : null}

      {!view && !error ? <p style={styles.empty}>Deployment readiness unavailable.</p> : null}

      {view ? (
        <>
          <div style={styles.summaryCard}>
            <div style={styles.summaryTopRow}>
              <StatusChip
                label={view.cloudState}
                tone={status?.deployment.is_cloud_hint ? colors.secondaryAccent : colors.warning}
              />
              <span style={styles.generatedAt}>{view.generatedAtLabel}</span>
            </div>
            <DetailRow label="Public URL" value={view.publicUrl} tone={colors.textPrimary} />
            <DetailRow label="Start Route" value={view.startUrl} tone={colors.primaryAccent} />
            <DetailRow label="Manifest" value={view.manifestUrl} tone={colors.secondaryAccent} />
          </div>

          <div style={styles.dualGrid}>
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Mobile Access</span>
                <StatusChip
                  label={view.mobileAccessLabel}
                  tone={status?.mobile.mobile_access.enabled ? colors.running : colors.warning}
                />
              </div>
              <div style={styles.sectionBody}>
                <DetailRow label="Port" value={view.mobilePortLabel} />
                <DetailRow label="Config Source" value={view.sourceLabel} />
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Wrapper State</span>
              </div>
              <div style={styles.sectionBody}>
                <DetailRow
                  label="Capacitor Wrapper"
                  value={view.wrapperLabel}
                  tone={status?.mobile.has_capacitor_wrapper ? colors.running : colors.warning}
                />
                <DetailRow
                  label="Capacitor Config"
                  value={view.configLabel}
                  tone={status?.mobile.has_capacitor_config ? colors.running : colors.warning}
                />
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
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  detailValue: {
    textAlign: "right",
    wordBreak: "break-word",
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    maxWidth: "60%",
  },
};