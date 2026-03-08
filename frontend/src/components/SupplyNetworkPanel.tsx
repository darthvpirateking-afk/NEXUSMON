import { type CSSProperties } from "react";
import { type SupplyBillingSnapshot, type SupplyProviderStatus } from "../api/supply";
import { useSupplyNetwork } from "../hooks/useSupplyNetwork";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";

const HEALTH_COLOR: Record<string, string> = {
  healthy: colors.running,
  degraded: colors.warning,
  disabled: colors.textSecondary,
  misconfigured: colors.error,
};

function providerTone(provider: SupplyProviderStatus): string {
  return HEALTH_COLOR[provider.health] ?? colors.error;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function StatRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={styles.statRow}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: tone ?? colors.textPrimary }}>{value}</span>
    </div>
  );
}

function BillingPanel({ billing }: { billing: SupplyBillingSnapshot | null }) {
  if (!billing) {
    return <p style={styles.empty}>No billing snapshot available.</p>;
  }

  const tone = billing.drift_detected ? colors.error : colors.secondaryAccent;

  return (
    <div style={styles.sectionBody}>
      <StatRow label="Global used" value={formatNumber(billing.global_tokens_used)} tone={tone} />
      <StatRow label="Global cap" value={formatNumber(billing.global_max_tokens)} tone={tone} />
      <StatRow label="Agent cap" value={formatNumber(billing.per_agent_max_tokens)} />
      <StatRow label="Call cap" value={formatNumber(billing.per_call_max_tokens)} />
      <StatRow label="Tracked agents" value={formatNumber(billing.tracked_agents)} />
      <StatRow label="Tracked models" value={formatNumber(billing.tracked_models)} />
    </div>
  );
}

export function SupplyNetworkPanel() {
  const { network, loading, error, refresh } = useSupplyNetwork();
  const providers = network?.providers ?? [];
  const routingPreview = network?.routing_preview ?? {};

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <span style={styles.eyebrow}>Supply Rail</span>
          <h2 style={styles.title}>Supply Network</h2>
          <p style={styles.subtitle}>
            Reads the verified backend supply slice from /supply/network and renders provider routing, health, and billing integrity without changing cockpit mission or artifact behavior.
          </p>
        </div>
        <div style={styles.headerActions}>
          {network ? <span style={styles.countBadge}>{providers.length} PROVIDERS</span> : null}
          <button
            type="button"
            style={styles.refreshBtn}
            onClick={() => void refresh()}
            disabled={loading}
            title="Refresh supply network"
          >
            {loading ? "…" : "↺"}
          </button>
        </div>
      </div>

      {error ? <p style={styles.errorText}>{error}</p> : null}

      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Providers</span>
          {network ? <span style={styles.generatedAt}>{new Date(network.generated_at).toLocaleTimeString()}</span> : null}
        </div>
        <div style={styles.providerList}>
          {providers.length === 0 && !loading ? (
            <p style={styles.empty}>No supply providers available.</p>
          ) : (
            providers.map((provider) => {
              const tone = providerTone(provider);
              return (
                <div
                  key={`${provider.tier}:${provider.provider}:${provider.model}`}
                  style={{
                    ...styles.providerCard,
                    borderColor: `${tone}44`,
                    boxShadow: shadows.glow(tone),
                  }}
                >
                  <div style={styles.providerTopRow}>
                    <div style={styles.providerTitleGroup}>
                      <span style={{ ...styles.providerTier, color: tone }}>{provider.tier.toUpperCase()}</span>
                      <span style={styles.providerName}>{provider.provider}/{provider.model}</span>
                    </div>
                    <span style={{ ...styles.healthBadge, color: tone, borderColor: `${tone}66` }}>
                      {provider.health.toUpperCase()}
                    </span>
                  </div>
                  <p style={styles.providerMeta}>
                    Modes: {(provider.routed_modes ?? []).join(", ") || "unassigned"} · Compliance: {provider.compliance} · Billing: {provider.billing_integrity}
                  </p>
                  <div style={styles.metricRow}>
                    <span style={styles.metricChip}>Failures {provider.failures}</span>
                    <span style={styles.metricChip}>Circuit {provider.circuit_open ? "OPEN" : "CLOSED"}</span>
                    <span style={styles.metricChip}>Score {Math.round((provider.score ?? 0) * 100)}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={styles.dualGrid}>
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Routing Preview</span>
          </div>
          <div style={styles.sectionBody}>
            <StatRow label="Strategic" value={String(routingPreview.strategic ?? "unresolved")} tone={colors.primaryAccent} />
            <StatRow label="Combat" value={String(routingPreview.combat ?? "unresolved")} tone={colors.warning} />
            <StatRow label="Offline" value={String(routingPreview.offline ?? "unresolved")} tone={colors.textSecondary} />
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Billing Integrity</span>
          </div>
          <BillingPanel billing={network?.billing ?? null} />
        </div>
      </div>
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
    maxWidth: "46rem",
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
  countBadge: {
    border: `1px solid ${colors.primaryAccent}66`,
    borderRadius: radii.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    color: colors.primaryAccent,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    background: `${colors.primaryAccent}12`,
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
  generatedAt: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  providerList: {
    display: "grid",
    gap: spacing.sm,
  },
  providerCard: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    border: "1px solid",
    background: `${colors.cardBg}`,
  },
  providerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  providerTitleGroup: {
    display: "grid",
    gap: spacing.xs,
  },
  providerTier: {
    fontSize: "0.58rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.14em",
  },
  providerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    fontFamily: "monospace",
  },
  healthBadge: {
    border: "1px solid",
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: "0.58rem",
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
    background: `${colors.bg}CC`,
  },
  providerMeta: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
  },
  metricRow: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  metricChip: {
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    background: `${colors.bg}D6`,
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: spacing.md,
  },
  sectionBody: {
    display: "grid",
    gap: spacing.xs,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: `${spacing.xs} 0`,
    borderBottom: `1px solid ${colors.borderColor}`,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  statValue: {
    textAlign: "right",
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  empty: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
  },
};