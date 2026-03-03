import { type CSSProperties } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";

export type NexusmonMode = "strategic" | "combat" | "guardian";

interface NexusmonModeSelectorProps {
  value: NexusmonMode;
  onChange: (mode: NexusmonMode) => void;
}

interface ModeConfig {
  value: NexusmonMode;
  label: string;
  tier: string;
  description: string;
  color: string;
  icon: string;
}

const MODES: ModeConfig[] = [
  {
    value: "strategic",
    label: "STRATEGIC",
    tier: "CORTEX",
    description: "Deep reasoning and long-range planning",
    color: "#00f0ff",
    icon: "[]",
  },
  {
    value: "combat",
    label: "COMBAT",
    tier: "REFLEX",
    description: "Fast routing and pattern response",
    color: "#a78bfa",
    icon: "<>",
  },
  {
    value: "guardian",
    label: "GUARDIAN",
    tier: "MONITOR",
    description: "Silent watch with no outbound LLM calls",
    color: "#fbbf24",
    icon: "()",
  },
];

export function NexusmonModeSelector({
  value,
  onChange,
}: NexusmonModeSelectorProps) {
  return (
    <section style={styles.card}>
      <div style={styles.sectionLabel}>Operator Mode</div>
      <div style={styles.grid}>
        {MODES.map((mode) => {
          const active = value === mode.value;
          return (
            <button
              key={mode.value}
              style={{
                ...styles.modeButton,
                borderColor: active ? mode.color : colors.borderColor,
                background: active ? `${mode.color}12` : "transparent",
                boxShadow: active ? shadows.glow(mode.color) : "none",
              }}
              onClick={() => onChange(mode.value)}
              type="button"
            >
              <div style={styles.modeHeader}>
                <span style={{ ...styles.modeIcon, color: mode.color }}>
                  {mode.icon}
                </span>
                <span
                  style={{
                    ...styles.modeLabel,
                    color: active ? mode.color : colors.textPrimary,
                  }}
                >
                  {mode.label}
                </span>
                <span
                  style={{
                    ...styles.tierBadge,
                    color: mode.color,
                    borderColor: `${mode.color}55`,
                  }}
                >
                  {mode.tier}
                </span>
              </div>
              <div
                style={{
                  ...styles.modeDescription,
                  color: active ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {mode.description}
              </div>
            </button>
          );
        })}
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
  sectionLabel: {
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: spacing.sm,
  },
  modeButton: {
    border: "1px solid",
    borderRadius: radii.md,
    padding: spacing.md,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: typography.fontFamily,
    transition: "all 0.2s ease",
    minHeight: 96,
  },
  modeHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modeIcon: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    fontFamily: "monospace",
  },
  modeLabel: {
    fontSize: "0.7rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    fontFamily: typography.fontFamily,
  },
  tierBadge: {
    marginLeft: "auto",
    fontSize: "0.55rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    border: "1px solid",
    borderRadius: radii.full,
    padding: "1px 6px",
    fontFamily: typography.fontFamily,
  },
  modeDescription: {
    fontSize: typography.fontSizeSm,
    lineHeight: 1.4,
    fontFamily: typography.fontFamily,
  },
};
