import { type CSSProperties } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { useEvolution } from "../hooks/useEvolution";

const STAGE_COLOR: Record<string, string> = {
  ORIGIN:          colors.textSecondary,
  EMBODIMENT:      colors.primaryAccent,
  EXECUTION_FRAME: colors.warning,
  MONARCH_SHELL:   "#FFD700",
  ZERO_POINT:      colors.secondaryAccent,
};

const TRAIT_COLOR: Record<string, string> = {
  curiosity:       "#60A5FA",
  loyalty:         colors.primaryAccent,
  aggression:      colors.error,
  patience:        "#34D399",
  creativity:      colors.secondaryAccent,
  autonomy:        colors.warning,
  protectiveness:  "#A78BFA",
};

const TRAIT_KEYS = [
  "curiosity", "loyalty", "aggression", "patience",
  "creativity", "autonomy", "protectiveness",
];

export function EvolutionPanel() {
  const {
    stage, xp, xpPct, traits, history,
    visualState, nextStage, nextThreshold,
    loading, refresh,
  } = useEvolution();

  const stageColor = STAGE_COLOR[stage] ?? colors.primaryAccent;
  const stageAdvances = history.filter((h) => h.event === "stage_advance").slice(-5);

  return (
    <section style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.nameRow}>
          <span style={{ ...styles.stageBadge, color: stageColor, borderColor: stageColor }}>
            {stage}
          </span>
          <h2 style={styles.title}>EVOLUTION</h2>
        </div>
        <button
          style={styles.refreshBtn}
          onClick={() => void refresh()}
          disabled={loading}
          title="Refresh evolution state"
        >
          {loading ? "…" : "↺"}
        </button>
      </div>

      <div style={{ ...styles.visualState, color: stageColor }}>
        {visualState}
      </div>

      {/* XP Bar */}
      <div style={styles.xpSection}>
        <div style={styles.xpLabel}>
          <span style={styles.xpText}>XP</span>
          <span style={styles.xpValue}>{xp.toLocaleString()}</span>
          <span style={{ ...styles.xpPct, color: stageColor }}>{xpPct.toFixed(1)}%</span>
          {nextStage && (
            <span style={styles.nextStageLabel}>→ {nextStage}</span>
          )}
        </div>
        <div style={styles.xpTrack}>
          <div
            style={{
              ...styles.xpFill,
              width: `${xpPct}%`,
              background: `linear-gradient(90deg, ${stageColor}88, ${stageColor})`,
              boxShadow: `0 0 8px ${stageColor}66`,
            }}
          />
        </div>
        {nextThreshold != null && (
          <div style={styles.thresholdLabel}>
            {nextThreshold.toLocaleString()} XP to next stage
          </div>
        )}
      </div>

      {/* Trait bars */}
      <div style={styles.traitsGrid}>
        {TRAIT_KEYS.map((key) => {
          const val = Math.round(traits[key] ?? 0);
          const color = TRAIT_COLOR[key] ?? colors.primaryAccent;
          return (
            <div key={key} style={styles.traitRow}>
              <span style={styles.traitLabel}>{key.toUpperCase()}</span>
              <div style={styles.traitTrack}>
                <div
                  style={{
                    ...styles.traitFill,
                    width: `${val}%`,
                    background: color,
                    boxShadow: val > 0 ? `0 0 6px ${color}55` : "none",
                  }}
                />
              </div>
              <span style={{ ...styles.traitVal, color: val > 0 ? color : colors.textSecondary }}>
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stage history */}
      {stageAdvances.length > 0 && (
        <div style={styles.historySection}>
          <div style={styles.historyTitle}>STAGE HISTORY</div>
          {stageAdvances.map((h, i) => (
            <div key={i} style={styles.historyRow}>
              <span style={{ color: STAGE_COLOR[h.stage ?? ""] ?? colors.textSecondary }}>
                {h.stage}
              </span>
              <span style={styles.historyXp}>
                @ {(h.xp_at_advance ?? 0).toLocaleString()} XP
              </span>
            </div>
          ))}
        </div>
      )}
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
    flexWrap: "wrap",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  stageBadge: {
    padding: `2px ${spacing.sm}`,
    borderRadius: radii.full,
    border: "1px solid",
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeXl,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
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
  visualState: {
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  xpSection: {
    display: "grid",
    gap: spacing.xs,
  },
  xpLabel: {
    display: "flex",
    gap: spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  xpText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  xpValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  xpPct: {
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    fontWeight: typography.fontWeightBold,
  },
  nextStageLabel: {
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    letterSpacing: "0.06em",
  },
  xpTrack: {
    height: 6,
    background: colors.borderColor,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: radii.full,
    transition: "width 0.6s ease",
  },
  thresholdLabel: {
    fontSize: "0.65rem",
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    textAlign: "right",
  },
  traitsGrid: {
    display: "grid",
    gap: spacing.sm,
  },
  traitRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr 36px",
    alignItems: "center",
    gap: spacing.sm,
  },
  traitLabel: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  traitTrack: {
    height: 5,
    background: colors.borderColor,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  traitFill: {
    height: "100%",
    borderRadius: radii.full,
    transition: "width 0.5s ease",
  },
  traitVal: {
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    fontWeight: typography.fontWeightBold,
    textAlign: "right",
  },
  historySection: {
    display: "grid",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTop: `1px solid ${colors.borderColor}`,
  },
  historyTitle: {
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    color: colors.textSecondary,
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.72rem",
    fontFamily: "monospace",
  },
  historyXp: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
  },
};
