import React, { useState, useEffect, type CSSProperties } from "react";
import { colors, spacing, radii, typography, shadows } from "../theme/cosmicTokens";
import { useWorldSpace, type WorldSpaceEntry } from "../hooks/useCosmicIntelligence";

const SCALE_COLORS: Record<string, string> = {
  quantum: colors.primaryAccent,
  molecular: "#4EF2C5",
  human: colors.textPrimary,
  civilizational: colors.warning,
  planetary: "#76C442",
  stellar: "#FF6B35",
  galactic: "#FF8C42",
  cosmic: colors.secondaryAccent,
  temporal: "#FFD700",
  multiversal: colors.primaryAccent,
};

const DEPTH_COLORS: Record<string, string> = {
  SURFACE: colors.textSecondary,
  DEEP: colors.primaryAccent,
  PROFOUND: "#FFD700",
};

interface Props {
  onAddEntry?: (entry: Partial<WorldSpaceEntry>) => void;
}

export function WorldSpacePanel({ onAddEntry }: Props) {
  const { graph, searchResults, loading, fetchMap, search } = useWorldSpace();
  const [query, setQuery] = useState("");
  const [scaleFilter, setScaleFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    void fetchMap();
  }, [fetchMap]);

  const handleSearch = () => {
    void search(query, scaleFilter || undefined);
  };

  const entries = searchResults.length > 0 ? searchResults : [];
  const entryCount = graph?.node_count ?? 0;

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.title}>WORLD SPACE</span>
          <span style={styles.count}>{entryCount} entries</span>
        </div>
        <span style={styles.sub}>Nexusmon's permanent knowledge universe</span>
      </div>

      {/* Search */}
      <div style={styles.searchRow}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <select
          value={scaleFilter}
          onChange={(e) => setScaleFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All scales</option>
          {Object.keys(SCALE_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button style={styles.searchBtn} onClick={handleSearch}>SEARCH</button>
      </div>

      {/* Map view toggle */}
      <div style={styles.mapToggleRow}>
        <button
          style={{
            ...styles.mapBtn,
            borderColor: showMap ? colors.secondaryAccent : colors.borderColor,
            color: showMap ? colors.secondaryAccent : colors.textSecondary,
          }}
          onClick={() => setShowMap((v) => !v)}
        >
          {showMap ? "◈ Hide Map" : "◈ Knowledge Map"}
        </button>
        {graph && (
          <span style={styles.graphStats}>
            {graph.node_count} nodes · {graph.edge_count} edges
          </span>
        )}
      </div>

      {/* Knowledge map iframe */}
      {showMap && (
        <div style={styles.mapFrame}>
          <iframe
            src="/v1/artifacts/templates/knowledge_map"
            style={styles.iframe}
            title="Knowledge Map"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {/* Entry list */}
      {loading && <div style={styles.loading}>Loading world space...</div>}

      {!loading && entries.length === 0 && query && (
        <div style={styles.empty}>No entries found for "{query}"</div>
      )}

      {!loading && entries.length === 0 && !query && entryCount === 0 && (
        <div style={styles.empty}>World space is empty. Ask a cosmic question to begin.</div>
      )}

      <div style={styles.entryList}>
        {entries.map((entry) => (
          <div
            key={entry.entry_id}
            style={{
              ...styles.entryCard,
              borderColor: expanded === entry.entry_id ? (SCALE_COLORS[entry.scale] ?? colors.borderColor) : colors.borderColor,
            }}
            onClick={() => setExpanded(expanded === entry.entry_id ? null : entry.entry_id)}
          >
            <div style={styles.entryRow}>
              <span
                style={{
                  ...styles.scaleDot,
                  background: SCALE_COLORS[entry.scale] ?? colors.textSecondary,
                  boxShadow: shadows.glow(SCALE_COLORS[entry.scale] ?? colors.textSecondary),
                }}
              />
              <span style={styles.entrySubject}>{entry.subject}</span>
              <span style={{ ...styles.depthTag, color: DEPTH_COLORS[entry.depth] ?? colors.textSecondary }}>
                {entry.depth}
              </span>
            </div>
            {expanded === entry.entry_id && (
              <div style={styles.entryContent}>{entry.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    background: colors.cardBg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },
  header: {
    borderBottom: `1px solid ${colors.borderColor}`,
    paddingBottom: spacing.md,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: "#FFD700",
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
  },
  count: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    padding: "1px 8px",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  searchRow: {
    display: "flex",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    background: colors.bg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.sm,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.xs} ${spacing.sm}`,
    outline: "none",
  },
  select: {
    background: colors.bg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.xs} ${spacing.xs}`,
    outline: "none",
  },
  searchBtn: {
    background: "transparent",
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.sm,
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    padding: `${spacing.xs} ${spacing.sm}`,
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
  mapToggleRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  mapBtn: {
    background: "transparent",
    border: "1px solid",
    borderRadius: radii.sm,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    cursor: "pointer",
    padding: `${spacing.xs} ${spacing.sm}`,
  },
  graphStats: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  mapFrame: {
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    overflow: "hidden",
    height: 300,
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#0D1117",
  },
  loading: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    textAlign: "center",
    padding: spacing.md,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    textAlign: "center",
    padding: spacing.md,
    fontStyle: "italic",
  },
  entryList: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
    maxHeight: 320,
    overflowY: "auto",
  },
  entryCard: {
    background: colors.bg,
    border: "1px solid",
    borderRadius: radii.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
    transition: "border-color 0.15s ease",
  },
  entryRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  entrySubject: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  depthTag: {
    fontSize: "0.68rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
  },
  entryContent: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    maxHeight: 120,
    overflowY: "auto",
    borderTop: `1px solid ${colors.borderColor}`,
    paddingTop: spacing.xs,
  },
};
