import React, { useState, type CSSProperties } from "react";
import { colors, spacing, radii, typography, shadows } from "../theme/cosmicTokens";
import { useCosmicQuery, useDeepQuery } from "../hooks/useCosmicIntelligence";

const SCALES = [
  { id: "quantum",        label: "QUANTUM",        color: colors.primaryAccent },
  { id: "molecular",      label: "MOLECULAR",       color: "#4EF2C5" },
  { id: "human",          label: "HUMAN",           color: colors.textPrimary },
  { id: "civilizational", label: "CIVILIZATIONAL",  color: colors.warning },
  { id: "planetary",      label: "PLANETARY",       color: "#76C442" },
  { id: "stellar",        label: "STELLAR",         color: "#FF6B35" },
  { id: "galactic",       label: "GALACTIC",        color: "#FF8C42" },
  { id: "cosmic",         label: "COSMIC",          color: colors.secondaryAccent },
  { id: "temporal",       label: "TEMPORAL",        color: "#FFD700" },
  { id: "multiversal",    label: "MULTIVERSAL",     color: colors.primaryAccent },
] as const;

const DEPTH_COLORS: Record<string, string> = {
  SURFACE: colors.textSecondary,
  DEEP: colors.primaryAccent,
  PROFOUND: "#FFD700",
};

interface Props {
  onAddToWorldSpace?: (subject: string, scale: string, content: string, depth: string) => void;
}

export function CosmicQueryPanel({ onAddToWorldSpace }: Props) {
  const [prompt, setPrompt] = useState("");
  const [scale, setScale] = useState("human");
  const [deepMode, setDeepMode] = useState(false);
  const [selectedScales, setSelectedScales] = useState<string[]>(["human", "cosmic"]);
  const [renderSrc, setRenderSrc] = useState<string | null>(null);

  const { response, loading: qLoading, error: qError, query } = useCosmicQuery();
  const { response: deepResp, loading: dLoading, error: dError, deepQuery } = useDeepQuery();

  const loading = qLoading || dLoading;
  const activeResponse = deepMode ? deepResp : response;
  const error = deepMode ? dError : qError;

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    if (deepMode) {
      void deepQuery(prompt, selectedScales, "strategic");
    } else {
      void query(prompt, scale, "strategic");
    }
    setRenderSrc(null);
  };

  const handleRenderView = () => {
    if (!activeResponse) return;
    const artifactId = "artifact_id" in activeResponse ? activeResponse.artifact_id : activeResponse.artifact_id;
    setRenderSrc(`/v1/artifacts/${artifactId}/render/cosmic`);
  };

  const handleAddToWorldSpace = () => {
    if (!response || !onAddToWorldSpace) return;
    onAddToWorldSpace(
      prompt.substring(0, 120),
      response.scale,
      response.content,
      response.reasoning_depth,
    );
  };

  const toggleScale = (s: string) => {
    setSelectedScales((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.title}>COSMIC INTELLIGENCE</span>
        <span style={styles.sub}>From quantum to multiverse · All scales · All time</span>
      </div>

      {/* Scale selector */}
      <div style={styles.scaleGrid}>
        {SCALES.map((s) => {
          const active = deepMode ? selectedScales.includes(s.id) : scale === s.id;
          return (
            <button
              key={s.id}
              style={{
                ...styles.scaleBtn,
                borderColor: active ? s.color : colors.borderColor,
                color: active ? s.color : colors.textSecondary,
                boxShadow: active ? shadows.glow(s.color) : "none",
                background: active ? s.color + "18" : colors.cardBg,
              }}
              onClick={() => deepMode ? toggleScale(s.id) : setScale(s.id)}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Deep mode toggle */}
      <div style={styles.toggleRow}>
        <button
          style={{
            ...styles.toggleBtn,
            background: deepMode ? colors.secondaryAccent + "22" : colors.cardBg,
            borderColor: deepMode ? colors.secondaryAccent : colors.borderColor,
            color: deepMode ? colors.secondaryAccent : colors.textSecondary,
          }}
          onClick={() => setDeepMode((v) => !v)}
        >
          {deepMode ? "◈ DEEP QUERY (multi-scale)" : "○ Single Scale"}
        </button>
        {deepMode && (
          <span style={styles.deepHint}>
            {selectedScales.length} scales selected
          </span>
        )}
      </div>

      {/* Prompt input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything across any scale of existence..."
        style={styles.textarea}
        rows={4}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
        }}
      />

      <button
        style={{
          ...styles.submitBtn,
          background: loading ? colors.cardBg : colors.primaryAccent + "22",
          borderColor: loading ? colors.borderColor : colors.primaryAccent,
          color: loading ? colors.textSecondary : colors.primaryAccent,
          cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
          opacity: loading || !prompt.trim() ? 0.5 : 1,
        }}
        onClick={handleSubmit}
        disabled={loading || !prompt.trim()}
      >
        {loading ? "◌ REASONING..." : "◈ QUERY"}
      </button>

      {/* Error */}
      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* Response */}
      {activeResponse && !loading && (
        <div style={styles.responseBlock}>
          <div style={styles.responseMeta}>
            {"reasoning_depth" in activeResponse && (
              <span style={{ color: DEPTH_COLORS[activeResponse.reasoning_depth] ?? colors.textPrimary }}>
                {activeResponse.reasoning_depth}
              </span>
            )}
            {"scale" in activeResponse && (
              <span style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
                {(activeResponse.scale as string).toUpperCase()}
              </span>
            )}
            {"total_tokens" in activeResponse && (
              <span style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
                {activeResponse.total_tokens} tokens
              </span>
            )}
            {"tokens_used" in activeResponse && !("total_tokens" in activeResponse) && (
              <span style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
                {activeResponse.tokens_used} tokens
              </span>
            )}
          </div>

          <div style={styles.responseText}>
            {"content" in activeResponse
              ? activeResponse.content
              : activeResponse.synthesis}
          </div>

          <div style={styles.responseActions}>
            <button style={styles.actionBtn} onClick={handleRenderView}>
              ◈ View Render
            </button>
            {!deepMode && onAddToWorldSpace && (
              <button style={{ ...styles.actionBtn, borderColor: "#FFD700", color: "#FFD700" }} onClick={handleAddToWorldSpace}>
                + WorldSpace
              </button>
            )}
          </div>
        </div>
      )}

      {/* Render iframe */}
      {renderSrc && (
        <div style={styles.iframeWrap}>
          <iframe
            src={renderSrc}
            style={styles.iframe}
            title="Cosmic Render"
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
    display: "flex",
    flexDirection: "column",
    gap: 4,
    borderBottom: `1px solid ${colors.borderColor}`,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.primaryAccent,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
  },
  sub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  scaleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: spacing.xs,
  },
  scaleBtn: {
    padding: "4px 0",
    border: "1px solid",
    borderRadius: radii.sm,
    background: colors.cardBg,
    fontSize: "0.68rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.05em",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggleBtn: {
    padding: "4px 14px",
    border: "1px solid",
    borderRadius: radii.sm,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  deepHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  textarea: {
    background: colors.bg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeMd,
    padding: spacing.md,
    resize: "vertical",
    outline: "none",
  },
  submitBtn: {
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
    padding: `${spacing.sm} ${spacing.md}`,
    background: colors.error + "11",
    borderRadius: radii.sm,
    border: `1px solid ${colors.error}33`,
  },
  responseBlock: {
    border: `1px solid ${colors.borderColor}`,
    borderLeft: `3px solid ${colors.primaryAccent}`,
    borderRadius: radii.md,
    padding: spacing.md,
    background: colors.bg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  responseMeta: {
    display: "flex",
    gap: spacing.xs,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
  },
  responseText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 320,
    overflowY: "auto",
  },
  responseActions: {
    display: "flex",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    padding: "3px 12px",
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.sm,
    background: "transparent",
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    cursor: "pointer",
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
