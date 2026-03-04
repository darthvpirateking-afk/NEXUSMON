import { type CSSProperties, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useCommandFusion, type StepResult } from "../hooks/useCommandFusion";

const STATUS_COLOR: Record<string, string> = {
  complete: colors.primaryAccent,
  error: colors.error,
  skipped: colors.textSecondary,
  partial: colors.warning,
};

const PRESET_COLOR: Record<string, string> = {
  FORGE: colors.primaryAccent,
  DEPLOY: colors.secondaryAccent,
  IGNITE: colors.warning,
};

function StepResultRow({ result }: { result: StepResult }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[result.status] ?? colors.textSecondary;
  return (
    <div style={styles.stepRow}>
      <div style={styles.stepHeader} onClick={() => setExpanded((v) => !v)}>
        <span style={{ ...styles.statusDot, background: color, boxShadow: `0 0 6px ${color}88` }} />
        <span style={styles.stepId}>{result.step_id}</span>
        <span style={styles.stepAction}>{result.action}</span>
        <span style={{ ...styles.statusLabel, color }}>{result.status}</span>
        <span style={styles.expandToggle}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={styles.stepBody}>
          {result.output != null && (
            <pre style={styles.outputPre}>{JSON.stringify(result.output, null, 2)}</pre>
          )}
          {result.error && (
            <pre style={{ ...styles.outputPre, color: colors.error }}>{result.error}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export function CommandFusionPanel() {
  const { presets, lastResult, executing, error, execute, executePreset } =
    useCommandFusion();

  const [opKey, setOpKey] = useState("");
  const [fusionError, setFusionError] = useState<string | null>(null);

  const handlePreset = async (presetName: string) => {
    setFusionError(null);
    const data = await executePreset(presetName, opKey);
    if (data?.error) setFusionError(String(data.error));
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>COMMAND FUSION</span>
        {executing && <span style={styles.executing}>EXECUTING…</span>}
      </div>

      {/* Operator key */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>OPERATOR KEY</span>
        <input
          style={styles.input}
          placeholder="Enter operator key for governed steps…"
          type="password"
          value={opKey}
          onChange={(e) => setOpKey(e.target.value)}
        />
      </div>

      {/* Presets */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>FUSION PRESETS</span>
        <div style={styles.presetRow}>
          {Object.entries(presets).map(([name, preset]) => (
            <button
              key={name}
              style={{
                ...styles.presetBtn,
                borderColor: PRESET_COLOR[name] ?? colors.primaryAccent,
                color: PRESET_COLOR[name] ?? colors.primaryAccent,
                opacity: executing ? 0.5 : 1,
                cursor: executing ? "not-allowed" : "pointer",
              }}
              onClick={() => void handlePreset(name)}
              disabled={executing}
              title={preset.description}
            >
              {name}
            </button>
          ))}
        </div>
        {Object.values(presets).map((p) => (
          <p key={p.name} style={styles.presetDesc}>
            <span style={{ color: PRESET_COLOR[p.name] ?? colors.primaryAccent, fontWeight: typography.fontWeightBold }}>
              {p.name}
            </span>
            {" — "}{p.description}
          </p>
        ))}
      </div>

      {fusionError && <p style={styles.errorText}>{fusionError}</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {/* Last result */}
      {lastResult && (
        <div style={styles.section}>
          <div style={styles.resultMeta}>
            <span style={styles.sectionLabel}>LAST FUSION</span>
            <span style={styles.fusionId}>{lastResult.fusion_id}</span>
            <span style={{
              ...styles.statusLabel,
              color: STATUS_COLOR[lastResult.status] ?? colors.textSecondary,
            }}>
              {lastResult.status.toUpperCase()}
            </span>
          </div>
          <div style={styles.stepList}>
            {lastResult.step_results.map((r, i) => (
              <StepResultRow key={`${r.step_id}-${i}`} result={r} />
            ))}
          </div>
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
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.08em",
  },
  executing: {
    color: colors.warning,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  section: { display: "grid", gap: spacing.sm },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  input: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  presetRow: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  presetBtn: {
    background: "transparent",
    border: "1px solid",
    borderRadius: radii.md,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.1em",
    padding: `${spacing.sm} ${spacing.lg}`,
    whiteSpace: "nowrap",
  },
  presetDesc: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  resultMeta: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  fusionId: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  statusLabel: {
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  stepList: { display: "grid", gap: spacing.xs },
  stepRow: {
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
    background: "#0a0f1e",
    userSelect: "none",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  stepId: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    flex: 1,
  },
  stepAction: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  expandToggle: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
  },
  stepBody: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderTop: `1px solid ${colors.borderColor}`,
  },
  outputPre: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: "0.72rem",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 160,
    overflowY: "auto",
  },
};
