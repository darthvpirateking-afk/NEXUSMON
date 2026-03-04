import React, { useState, type CSSProperties } from "react";
import { colors, spacing, radii, typography, shadows } from "../theme/cosmicTokens";
import { useTimeline } from "../hooks/useCosmicIntelligence";

function detectScaleFromYears(startYear: number, endYear: number): string {
  const span = Math.abs(endYear - startYear);
  if (span >= 1_000_000_000) return "COSMIC";
  if (span >= 100_000_000) return "PLANETARY";
  if (span >= 10_000) return "CIVILIZATIONAL";
  return "HUMAN";
}

const SCALE_COLORS: Record<string, string> = {
  COSMIC: colors.secondaryAccent,
  PLANETARY: "#76C442",
  CIVILIZATIONAL: colors.warning,
  HUMAN: colors.textPrimary,
};

export function TimelinePanel() {
  const [subject, setSubject] = useState("");
  const [startYear, setStartYear] = useState("-13800000000");
  const [endYear, setEndYear] = useState("2026");
  const [renderSrc, setRenderSrc] = useState<string | null>(null);

  const { result, loading, error, generateTimeline } = useTimeline();

  const scaleLabel = detectScaleFromYears(Number(startYear) || 0, Number(endYear) || 2026);
  const scaleColor = SCALE_COLORS[scaleLabel] ?? colors.textPrimary;

  const handleGenerate = () => {
    if (!subject.trim()) return;
    const sy = parseInt(startYear, 10);
    const ey = parseInt(endYear, 10);
    if (isNaN(sy) || isNaN(ey)) return;
    void generateTimeline(subject, sy, ey);
    setRenderSrc(null);
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.title}>TIMELINE ENGINE</span>
        <span style={styles.sub}>From the Big Bang to heat death · Any subject · Any span</span>
      </div>

      <div style={styles.inputRow}>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (e.g. 'Human civilization', 'The Sun', 'Roman Empire')"
          style={{ ...styles.input, flex: 2 }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <div style={styles.yearGroup}>
          <input
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="Start year (−13.8B = Big Bang)"
            style={{ ...styles.input, width: 180 }}
          />
          <span style={styles.arrow}>→</span>
          <input
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            placeholder="End year"
            style={{ ...styles.input, width: 120 }}
          />
        </div>
      </div>

      <div style={styles.scaleRow}>
        <span style={{ ...styles.scaleBadge, borderColor: scaleColor, color: scaleColor }}>
          {scaleLabel}
        </span>
        <span style={styles.scaleHint}>scale auto-detected from year range</span>
      </div>

      <button
        style={{
          ...styles.genBtn,
          background: loading ? colors.cardBg : scaleColor + "22",
          borderColor: loading ? colors.borderColor : scaleColor,
          color: loading ? colors.textSecondary : scaleColor,
          cursor: loading || !subject.trim() ? "not-allowed" : "pointer",
          opacity: loading || !subject.trim() ? 0.5 : 1,
        }}
        onClick={handleGenerate}
        disabled={loading || !subject.trim()}
      >
        {loading ? "◌ GENERATING..." : "◈ GENERATE TIMELINE"}
      </button>

      {error && <div style={styles.error}>{error}</div>}

      {result && !loading && (
        <div style={styles.resultBlock}>
          <div style={styles.resultMeta}>
            <span style={{ color: scaleColor }}>{result.subject}</span>
            <span style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
              {result.start_year} → {result.end_year}
            </span>
            <span style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
              {result.events.length} events
            </span>
          </div>

          <div style={styles.eventList}>
            {result.events.map((ev, i) => (
              <div key={i} style={styles.eventRow}>
                <span style={{ ...styles.eventYear, color: scaleColor }}>
                  {ev.year.toLocaleString()}
                </span>
                <span style={styles.eventDot} />
                <span style={styles.eventDesc}>{ev.event}</span>
              </div>
            ))}
          </div>

          <button
            style={styles.renderBtn}
            onClick={() => setRenderSrc(`/v1/artifacts/${result.artifact_id}/render/timeline`)}
          >
            ◈ View Full Render
          </button>
        </div>
      )}

      {renderSrc && (
        <div style={styles.iframeWrap}>
          <iframe
            src={renderSrc}
            style={styles.iframe}
            title="Timeline Render"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
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
  title: {
    color: "#FFD700",
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
  },
  sub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  inputRow: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  input: {
    background: colors.bg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.sm,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.xs} ${spacing.sm}`,
    outline: "none",
    minWidth: 80,
  },
  yearGroup: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  scaleRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  scaleBadge: {
    border: "1px solid",
    borderRadius: radii.sm,
    padding: "2px 10px",
    fontSize: "0.72rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  scaleHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontStyle: "italic",
  },
  genBtn: {
    padding: `${spacing.sm} ${spacing.lg}`,
    border: "1px solid",
    borderRadius: radii.md,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeMd,
    letterSpacing: "0.06em",
    transition: "all 0.15s ease",
    alignSelf: "flex-start",
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: colors.error + "11",
    borderRadius: radii.sm,
  },
  resultBlock: {
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    padding: spacing.md,
    background: colors.bg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  resultMeta: {
    display: "flex",
    gap: spacing.xs,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${colors.borderColor}`,
    paddingBottom: spacing.sm,
  },
  eventList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 280,
    overflowY: "auto",
  },
  eventRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  eventYear: {
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    minWidth: 100,
    textAlign: "right",
    letterSpacing: "0.03em",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#FFD700",
    marginTop: 4,
    flexShrink: 0,
  },
  eventDesc: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    lineHeight: 1.5,
    flex: 1,
  },
  renderBtn: {
    background: "transparent",
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.sm,
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    cursor: "pointer",
    padding: `${spacing.xs} ${spacing.sm}`,
    alignSelf: "flex-start",
  },
  iframeWrap: {
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    overflow: "hidden",
    height: 420,
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#0D1117",
  },
};
