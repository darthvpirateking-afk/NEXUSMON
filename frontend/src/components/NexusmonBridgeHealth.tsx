import { type CSSProperties } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useBridgeHealth } from "../hooks/useBridgeHealth";

export function NexusmonBridgeHealth() {
  const { data, loading, error, refresh } = useBridgeHealth();
  const providers = data?.providers ?? [];
  const circuits = data?.circuit_breaker ?? {};
  const hasCircuits = Object.keys(circuits).length > 0;

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.sectionLabel}>Bridge Health</span>
        <div style={styles.headerActions}>
          {!loading ? (
            <span
              style={{
                ...styles.statusBadge,
                color: error
                  ? colors.error
                  : data?.status === "ok"
                    ? "#34d399"
                    : "#fbbf24",
                borderColor: error
                  ? `${colors.error}55`
                  : data?.status === "ok"
                    ? "#34d39955"
                    : "#fbbf2455",
              }}
            >
              {error ? "UNREACHABLE" : data?.status === "ok" ? "NOMINAL" : "DEGRADED"}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void refresh()}
            style={styles.refreshButton}
            title="Refresh bridge health"
          >
            ↺
          </button>
        </div>
      </div>

      {providers.length > 0 ? (
        <div style={styles.group}>
          <div style={styles.groupLabel}>Providers</div>
          <div style={styles.providerList}>
            {providers.map((provider) => (
              <span key={provider} style={styles.providerChip}>
                {provider}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.group}>
        <div style={styles.groupLabel}>Circuit Breaker</div>
        {!hasCircuits ? (
          <div style={styles.nominalText}>All circuits nominal. No failures recorded.</div>
        ) : (
          <div style={styles.circuitList}>
            {Object.entries(circuits).map(([model, state]) => (
              <div
                key={model}
                style={{
                  ...styles.circuitRow,
                  borderColor: state.open ? `${colors.error}55` : colors.borderColor,
                  background: state.open ? `${colors.error}0f` : "#080b10",
                }}
              >
                <span style={styles.modelName}>{model}</span>
                <div style={styles.modelMetrics}>
                  <span style={styles.metricText}>failures: {state.failures}</span>
                  <span
                    style={{
                      ...styles.stateText,
                      color: state.open ? colors.error : "#34d399",
                    }}
                  >
                    {state.open ? "OPEN" : "CLOSED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    fontSize: "0.6rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    border: "1px solid",
    borderRadius: radii.full,
    padding: "2px 8px",
    fontFamily: typography.fontFamily,
  },
  refreshButton: {
    background: "transparent",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.primaryAccent,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontSize: "1rem",
    minWidth: 28,
    minHeight: 28,
    padding: "0 6px",
  },
  group: {
    display: "grid",
    gap: spacing.xs,
  },
  groupLabel: {
    fontSize: "0.6rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  providerList: {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  providerChip: {
    fontSize: "0.65rem",
    fontFamily: "monospace",
    color: colors.primaryAccent,
    background: `${colors.primaryAccent}10`,
    border: `1px solid ${colors.primaryAccent}33`,
    borderRadius: radii.full,
    padding: "2px 8px",
  },
  nominalText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  circuitList: {
    display: "grid",
    gap: spacing.xs,
  },
  circuitRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    border: "1px solid",
    borderRadius: radii.md,
    padding: `${spacing.xs} ${spacing.sm}`,
  },
  modelName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  modelMetrics: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  metricText: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
  },
  stateText: {
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.05em",
    fontFamily: typography.fontFamily,
  },
};
