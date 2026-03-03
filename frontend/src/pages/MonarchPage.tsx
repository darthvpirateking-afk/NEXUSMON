import { type CSSProperties } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { KernelShiftPanel } from "../components/KernelShiftPanel";
import { SealMatrixPanel } from "../components/SealMatrixPanel";
import { CommandFusionPanel } from "../components/CommandFusionPanel";

export function MonarchPage() {
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>MONARCH SHELL</span>
          <span style={styles.headerSep}>·</span>
          <span style={styles.headerSub}>EXECUTION FRAME ACTIVE</span>
        </div>
        <div style={styles.headerBadge}>STAGE 4</div>
      </header>

      {/* Top row: Kernel Shift + Seal Matrix */}
      <div style={styles.topRow}>
        <KernelShiftPanel />
        <SealMatrixPanel />
      </div>

      {/* Full-width: Command Fusion */}
      <div style={styles.fusionRow}>
        <CommandFusionPanel />
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
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.12em",
    textShadow: `0 0 12px ${colors.primaryAccent}88`,
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
    color: colors.warning,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    border: `1px solid ${colors.warning}66`,
    borderRadius: radii.md,
    padding: `2px ${spacing.sm}`,
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.lg,
  },
  fusionRow: {
    gridColumn: "1 / -1",
  },
};
