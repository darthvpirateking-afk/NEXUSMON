import { type CSSProperties, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useKernelShift } from "../hooks/useKernelShift";

const TIER_COLOR: Record<string, string> = {
  cortex: colors.primaryAccent,
  reflex: colors.secondaryAccent,
  fallback: colors.warning,
};

export function KernelShiftPanel() {
  const { activeConfig, history, loading, error, applyShift, rollback } =
    useKernelShift();

  const [opKey, setOpKey] = useState("");
  const [primaryTier, setPrimaryTier] = useState("cortex");
  const [latencyMs, setLatencyMs] = useState("");
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [rollbackN, setRollbackN] = useState("1");
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const handleShift = async () => {
    setShiftError(null);
    const config = {
      primary_tier: primaryTier,
      latency_target_ms: latencyMs ? Number(latencyMs) : null,
    };
    const data = await applyShift(config, opKey);
    if (data?.error) setShiftError(String(data.error));
  };

  const handleRollback = async () => {
    setRollbackError(null);
    const data = await rollback(Number(rollbackN), opKey);
    if (data?.error) setRollbackError(String(data.error));
  };

  const recentHistory = history.slice(-5).reverse();

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>KERNEL SHIFT</span>
        {loading && <span style={styles.loading}>…</span>}
      </div>

      {/* Active config */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>ACTIVE CONFIG</span>
        {activeConfig && Object.keys(activeConfig).length > 0 ? (
          <div style={styles.configBox}>
            {activeConfig.primary_tier && (
              <div style={styles.configRow}>
                <span style={styles.configKey}>PRIMARY TIER</span>
                <span style={{
                  ...styles.configVal,
                  color: TIER_COLOR[activeConfig.primary_tier] ?? colors.textPrimary,
                }}>
                  {activeConfig.primary_tier}
                </span>
              </div>
            )}
            {activeConfig.latency_target_ms != null && (
              <div style={styles.configRow}>
                <span style={styles.configKey}>LATENCY TARGET</span>
                <span style={styles.configVal}>{activeConfig.latency_target_ms}ms</span>
              </div>
            )}
          </div>
        ) : (
          <p style={styles.emptyText}>No shifts applied — using runtime.json defaults.</p>
        )}
      </div>

      {/* Apply shift */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>APPLY SHIFT</span>
        <div style={styles.inputRow}>
          <select
            style={styles.select}
            value={primaryTier}
            onChange={(e) => setPrimaryTier(e.target.value)}
          >
            <option value="cortex">cortex</option>
            <option value="reflex">reflex</option>
            <option value="fallback">fallback</option>
          </select>
          <input
            style={{ ...styles.input, width: 100 }}
            placeholder="Latency ms"
            value={latencyMs}
            onChange={(e) => setLatencyMs(e.target.value)}
            type="number"
            min="0"
          />
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Operator key"
            type="password"
            value={opKey}
            onChange={(e) => setOpKey(e.target.value)}
          />
          <button
            style={{
              ...styles.actionBtn,
              opacity: !opKey.trim() ? 0.5 : 1,
              cursor: !opKey.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleShift()}
            disabled={!opKey.trim()}
          >
            SHIFT
          </button>
        </div>
        {shiftError && <p style={styles.errorText}>{shiftError}</p>}
      </div>

      {/* Rollback */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>ROLLBACK</span>
        <div style={styles.inputRow}>
          <input
            style={{ ...styles.input, width: 60 }}
            placeholder="N"
            value={rollbackN}
            onChange={(e) => setRollbackN(e.target.value)}
            type="number"
            min="1"
          />
          <button
            style={{
              ...styles.actionBtn,
              borderColor: colors.warning,
              color: colors.warning,
              opacity: !opKey.trim() ? 0.5 : 1,
              cursor: !opKey.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleRollback()}
            disabled={!opKey.trim()}
          >
            ROLLBACK
          </button>
        </div>
        {rollbackError && <p style={styles.errorText}>{rollbackError}</p>}
      </div>

      {/* History (last 5) */}
      {recentHistory.length > 0 && (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>RECENT SHIFTS</span>
          <div style={styles.historyList}>
            {recentHistory.map((entry, i) => (
              <div key={i} style={styles.historyRow}>
                <span style={{
                  ...styles.tierDot,
                  background: TIER_COLOR[(entry as Record<string, string>).primary_tier] ?? colors.textSecondary,
                }} />
                <span style={styles.historyTier}>
                  {(entry as Record<string, string>).primary_tier ?? "—"}
                </span>
                <span style={styles.historyTs}>
                  {(entry as Record<string, string>).timestamp
                    ? new Date((entry as Record<string, string>).timestamp).toLocaleTimeString()
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p style={styles.errorText}>{error}</p>}
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
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.08em",
  },
  loading: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
  },
  section: { display: "grid", gap: spacing.sm },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  configBox: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    padding: spacing.md,
    display: "grid",
    gap: spacing.xs,
  },
  configRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  configKey: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  configVal: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    fontWeight: typography.fontWeightBold,
  },
  emptyText: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
  },
  inputRow: {
    display: "flex",
    gap: spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
  },
  actionBtn: {
    background: "transparent",
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.md,
    color: colors.primaryAccent,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    padding: `${spacing.sm} ${spacing.lg}`,
    whiteSpace: "nowrap",
  },
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  historyList: { display: "grid", gap: "4px" },
  historyRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: "#0a0f1e",
    borderRadius: radii.sm,
    border: `1px solid ${colors.borderColor}`,
  },
  tierDot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  historyTier: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    flex: 1,
  },
  historyTs: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: "monospace",
  },
};
