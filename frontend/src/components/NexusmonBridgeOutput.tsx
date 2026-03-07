import { type CSSProperties } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { type BridgeOutputState, useBridgeOutput } from "../hooks/useBridgeOutput";

const MODE_COLOR: Record<string, string> = {
  strategic: "#00f0ff",
  combat: "#a78bfa",
  guardian: "#fbbf24",
};

type BridgeOutputView = {
  hasOutput: boolean;
  sourceLabel: string;
  sourceTone: string;
  statusLabel: string;
  statusTone: string;
  detail: string;
  emptyTitle: string;
  emptyBody: string;
};

export function buildBridgeOutputView(state: BridgeOutputState): BridgeOutputView {
  if (!state.output) {
    return {
      hasOutput: false,
      sourceLabel: "UNAVAILABLE",
      sourceTone: colors.textSecondary,
      statusLabel: "SESSION-LOCAL ONLY",
      statusTone: colors.warning,
      detail: "No backend bridge output is present in this browser session.",
      emptyTitle: "No backend bridge output",
      emptyBody:
        "Unavailable from the backend. This panel only reflects session-local relay state when output is captured.",
    };
  }

  if (state.backendBacked) {
    return {
      hasOutput: true,
      sourceLabel: "BACKEND-PROVIDED",
      sourceTone: colors.running,
      statusLabel: "SESSION RELAY",
      statusTone: colors.primaryAccent,
      detail: "Backend-provided output captured through browser polling. This is not a live stream.",
      emptyTitle: "",
      emptyBody: "",
    };
  }

  return {
    hasOutput: true,
    sourceLabel: "SESSION-LOCAL ONLY",
    sourceTone: colors.warning,
    statusLabel: "UNAVAILABLE",
    statusTone: colors.warning,
    detail: "Unavailable from the backend. This output exists only in browser-local module state.",
    emptyTitle: "",
    emptyBody: "",
  };
}

export function NexusmonBridgeOutput() {
  const { output, mode, backendBacked } = useBridgeOutput();
  const view = buildBridgeOutputView({ output, mode, backendBacked });
  const accent = mode ? (MODE_COLOR[mode] ?? colors.primaryAccent) : colors.primaryAccent;

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.sectionLabel}>Bridge Output</span>
        <div style={styles.badgeGroup}>
          <span
            style={{
              ...styles.truthBadge,
              color: view.sourceTone,
              borderColor: `${view.sourceTone}55`,
            }}
          >
            {view.sourceLabel}
          </span>
          <span
            style={{
              ...styles.truthBadge,
              color: view.statusTone,
              borderColor: `${view.statusTone}55`,
            }}
          >
            {view.statusLabel}
          </span>
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
      </div>
      <p style={styles.detailText}>{view.detail}</p>
      {!output ? (
        <div style={styles.emptyState}>
          <strong style={styles.emptyTitle}>{view.emptyTitle}</strong>
          <span>{view.emptyBody}</span>
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
    flexWrap: "wrap",
  },
  badgeGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  sectionLabel: {
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  truthBadge: {
    fontSize: "0.58rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    border: "1px solid",
    borderRadius: radii.full,
    padding: "2px 8px",
    fontFamily: typography.fontFamily,
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
  detailText: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
  },
  emptyState: {
    display: "grid",
    gap: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontStyle: "normal",
    fontWeight: typography.fontWeightBold,
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
