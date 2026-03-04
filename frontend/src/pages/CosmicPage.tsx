import React, { type CSSProperties } from "react";
import { colors, spacing, radii, typography } from "../theme/cosmicTokens";
import { CosmicQueryPanel } from "../components/CosmicQueryPanel";
import { WorldSpacePanel } from "../components/WorldSpacePanel";
import { TimelinePanel } from "../components/TimelinePanel";
import { useWorldSpace } from "../hooks/useCosmicIntelligence";

export function CosmicPage() {
  const { addEntry } = useWorldSpace();

  const handleAddToWorldSpace = (
    subject: string,
    scale: string,
    content: string,
    depth: string,
  ) => {
    void addEntry({ subject, scale, content, depth, operator: "Regan Harris", tags: [scale], connections: [] });
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>COSMIC INTELLIGENCE · ALL SCALES · ALL TIME</h1>
        <p style={styles.sub}>
          From quantum to multiverse · From Big Bang to heat death · One operator: Regan Harris
        </p>
      </div>

      {/* Main grid: 60/40 */}
      <div style={styles.mainGrid}>
        <div style={styles.leftCol}>
          <CosmicQueryPanel onAddToWorldSpace={handleAddToWorldSpace} />
        </div>
        <div style={styles.rightCol}>
          <WorldSpacePanel />
        </div>
      </div>

      {/* Timeline — full width */}
      <div style={styles.timelineRow}>
        <TimelinePanel />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    padding: spacing.lg,
    height: "100%",
    overflowY: "auto",
  },
  header: {
    borderBottom: `1px solid ${colors.borderColor}`,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.primaryAccent,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
    margin: 0,
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    margin: 0,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "3fr 2fr",
    gap: spacing.lg,
    alignItems: "start",
  },
  leftCol: {
    minWidth: 0,
  },
  rightCol: {
    minWidth: 0,
  },
  timelineRow: {
    width: "100%",
  },
};
