import { type CSSProperties } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useBridgeOutput } from "../hooks/useBridgeOutput";

const MODE_COLOR: Record<string, string> = {
  strategic: "#00f0ff",
  combat: "#a78bfa",
  guardian: "#fbbf24",
};

export function NexusmonBridgeOutput() {
  const { output, mode } = useBridgeOutput();
  const accent = mode ? (MODE_COLOR[mode] ?? colors.primaryAccent) : colors.primaryAccent;

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.sectionLabel}>Bridge Output</span>
        {mode ? (
          <span
            style={{
              ...styles.modeBadge,
              color: accent,
              borderColor: `${accent}55`,
            }}
          >
            {mode.toUpperCase()}
          </span>
        ) : null}
      </div>
      {!output ? (
        <div style={styles.emptyState}>
          No output yet. Run a mission in strategic or combat mode.
        </div>
      ) : (
        <div
          style={{
            ...styles.outputBox,
            borderColor: `${accent}44`,
            boxShadow: `inset 0 0 18px ${accent}11`,
          }}
        >
          <pre style={styles.outputText}>{output}</pre>
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
  },
  sectionLabel: {
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  modeBadge: {
    fontSize: "0.6rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    border: "1px solid",
    borderRadius: radii.full,
    padding: "2px 8px",
    fontFamily: typography.fontFamily,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  outputBox: {
    background: "#080b10",
    border: "1px solid",
    borderRadius: radii.md,
    padding: spacing.md,
    maxHeight: 280,
    overflowY: "auto",
  },
  outputText: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.6,
  },
};
