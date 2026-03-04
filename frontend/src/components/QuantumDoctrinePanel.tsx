import { type CSSProperties, useState } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { useQuantumDoctrine } from "../hooks/useQuantumDoctrine";

export function QuantumDoctrinePanel() {
  const { states, history, loading, error, snapshot, collapse } = useQuantumDoctrine();

  const [snapName, setSnapName] = useState("");
  const [collapseName, setCollapseName] = useState("");
  const [opKey, setOpKey] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const handleSnapshot = async () => {
    setActionError(null);
    setActionMsg(null);
    const data = await snapshot(snapName);
    if (data?.error) setActionError(String(data.error));
    else { setActionMsg(`State "${snapName}" saved`); setSnapName(""); }
  };

  const handleCollapse = async () => {
    setActionError(null);
    setActionMsg(null);
    const data = await collapse(collapseName, opKey);
    if (data?.error) setActionError(String(data.error));
    else setActionMsg(`Collapsed to "${collapseName}"`);
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>QUANTUM DOCTRINE</span>
        <span style={styles.count}>{states.length} STATE{states.length !== 1 ? "S" : ""}</span>
        {loading && <span style={styles.dim}>…</span>}
      </div>

      {/* Snapshot */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>SAVE STATE</span>
        <div style={styles.row}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="State name (e.g. pre-combat)"
            value={snapName}
            onChange={(e) => setSnapName(e.target.value)}
          />
          <button
            style={{ ...styles.btn, opacity: !snapName.trim() ? 0.5 : 1, cursor: !snapName.trim() ? "not-allowed" : "pointer" }}
            onClick={() => void handleSnapshot()}
            disabled={!snapName.trim()}
          >
            SNAPSHOT
          </button>
        </div>
      </div>

      {/* Saved states */}
      {states.length > 0 && (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>SAVED STATES</span>
          <div style={styles.stateList}>
            {states.slice().reverse().slice(0, 8).map((s, i) => (
              <div key={i} style={styles.stateRow}>
                <span style={styles.stateName}>{s.name}</span>
                <span style={styles.stageTag}>{s.evolution_stage}</span>
                <span style={styles.dim}>
                  {new Date(s.snapshot_at).toLocaleTimeString()}
                </span>
                <button
                  style={styles.collapseBtn}
                  onClick={() => setCollapseName(s.name)}
                >
                  SELECT
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>COLLAPSE TO STATE</span>
        <div style={styles.row}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="State name"
            value={collapseName}
            onChange={(e) => setCollapseName(e.target.value)}
          />
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Operator key"
            type="password"
            value={opKey}
            onChange={(e) => setOpKey(e.target.value)}
          />
          <button
            style={{ ...styles.btn, borderColor: colors.primaryAccent, color: colors.primaryAccent, opacity: (!collapseName.trim() || !opKey.trim()) ? 0.5 : 1, cursor: (!collapseName.trim() || !opKey.trim()) ? "not-allowed" : "pointer" }}
            onClick={() => void handleCollapse()}
            disabled={!collapseName.trim() || !opKey.trim()}
          >
            COLLAPSE
          </button>
        </div>
      </div>

      {actionMsg && <p style={styles.ok}>{actionMsg}</p>}
      {actionError && <p style={styles.err}>{actionError}</p>}

      {/* Collapse history */}
      {history.length > 0 && (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>COLLAPSE HISTORY</span>
          {history.slice().reverse().slice(0, 3).map((h, i) => (
            <div key={i} style={styles.histRow}>
              <span style={styles.dim}>→</span>
              <span style={styles.stateName}>{h.collapsed_to}</span>
              <span style={styles.dim}>{new Date(h.collapsed_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p style={styles.err}>{error}</p>}
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
  header: { display: "flex", alignItems: "center", gap: spacing.md },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.08em",
    flex: 1,
  },
  count: {
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    border: `1px solid ${colors.primaryAccent}66`,
    borderRadius: radii.md,
    padding: `2px ${spacing.sm}`,
  },
  dim: { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.fontSizeSm },
  section: { display: "grid", gap: spacing.sm },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.62rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  row: { display: "flex", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" },
  input: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    outline: "none",
    minWidth: 80,
  },
  btn: {
    background: "transparent",
    border: `1px solid ${colors.secondaryAccent}`,
    borderRadius: radii.md,
    color: colors.secondaryAccent,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    padding: `${spacing.sm} ${spacing.lg}`,
    whiteSpace: "nowrap",
  },
  stateList: { display: "grid", gap: "4px" },
  stateRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: "#0a0f1e",
    borderRadius: radii.sm,
    border: `1px solid ${colors.borderColor}`,
  },
  stateName: {
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    flex: 1,
  },
  stageTag: {
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    color: colors.primaryAccent,
    letterSpacing: "0.06em",
  },
  collapseBtn: {
    background: "transparent",
    border: `1px solid ${colors.primaryAccent}44`,
    borderRadius: radii.sm,
    color: colors.primaryAccent,
    cursor: "pointer",
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
    padding: `1px ${spacing.sm}`,
  },
  histRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} 0`,
  },
  ok: { margin: 0, color: colors.primaryAccent, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamily },
  err: { margin: 0, color: colors.error, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamily },
};
