import { type CSSProperties } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { ZeroPointPanel } from "../components/ZeroPointPanel";
import { QuantumDoctrinePanel } from "../components/QuantumDoctrinePanel";
import { AutonomyPanel } from "../components/AutonomyPanel";

export function ZeroPointPage() {
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>ZERO-POINT FORM</span>
          <span style={styles.headerSep}>·</span>
          <span style={styles.headerSub}>MONARCH SHELL ACTIVE</span>
        </div>
        <div style={styles.headerBadge}>STAGE 5 — FINAL</div>
      </header>

      {/* Top row: Override + Quantum Doctrine */}
      <div style={styles.topRow}>
        <ZeroPointPanel />
        <QuantumDoctrinePanel />
      </div>

      {/* Full-width: Autonomy Engine */}
      <div style={styles.bottomRow}>
        <AutonomyPanel />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: spacing.lg,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.md} ${spacing.lg}`,
    background: colors.cardBg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.lg,
    boxShadow: shadows.card,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
  },
  headerTitle: {
    color: colors.secondaryAccent,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.12em",
    textShadow: `0 0 12px ${colors.secondaryAccent}88`,
  },
  headerSep: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
  },
  headerSub: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.65rem",
    letterSpacing: "0.12em",
  },
  headerBadge: {
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    border: `1px solid ${colors.primaryAccent}66`,
    borderRadius: radii.md,
    padding: `2px ${spacing.sm}`,
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.lg,
  },
  bottomRow: {
    gridColumn: "1 / -1",
  },
};
