import { type CSSProperties, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useSealMatrix, type ApprovalResult } from "../hooks/useSealMatrix";

const SEAL_COLOR: Record<string, string> = {
  OPEN: colors.textSecondary,
  OPERATOR: colors.primaryAccent,
  DUAL: colors.secondaryAccent,
  SOVEREIGN: "#FFD700",
};

export function SealMatrixPanel() {
  const { registry, pending, loading, error, approve } = useSealMatrix();

  const [action, setAction] = useState("");
  const [opKey, setOpKey] = useState("");
  const [docHash, setDocHash] = useState("");
  const [lastResult, setLastResult] = useState<ApprovalResult | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const handleApprove = async () => {
    setApproveError(null);
    setLastResult(null);
    const result = await approve(action, opKey, docHash || undefined);
    if (result.error) {
      setApproveError(String(result.error));
    } else {
      setLastResult(result as ApprovalResult);
    }
  };

  const hasPending = Object.keys(pending).length > 0;

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>SEAL MATRIX</span>
        {loading && <span style={styles.loading}>…</span>}
        {hasPending && (
          <span style={{ ...styles.pendingPulse }}>
            {Object.keys(pending).length} PENDING
          </span>
        )}
      </div>

      {/* Action registry grid */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>ACTION REGISTRY</span>
        <div style={styles.grid}>
          {Object.entries(registry).map(([act, level]) => (
            <div
              key={act}
              style={styles.registryRow}
              onClick={() => setAction(act)}
              title="Click to select"
            >
              <span style={styles.actionPath}>{act}</span>
              <span style={{
                ...styles.levelBadge,
                color: SEAL_COLOR[level] ?? colors.textSecondary,
                borderColor: SEAL_COLOR[level] ?? colors.borderColor,
                boxShadow: level === "SOVEREIGN" ? `0 0 8px #FFD70044` : undefined,
              }}>
                {level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Approve form */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>REQUEST APPROVAL</span>
        <div style={styles.inputCol}>
          <input
            style={styles.input}
            placeholder="Action path (click row above to select)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Operator key"
            type="password"
            value={opKey}
            onChange={(e) => setOpKey(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Doctrine hash (SOVEREIGN only)"
            value={docHash}
            onChange={(e) => setDocHash(e.target.value)}
          />
          <button
            style={{
              ...styles.actionBtn,
              opacity: !action.trim() || !opKey.trim() ? 0.5 : 1,
              cursor: !action.trim() || !opKey.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleApprove()}
            disabled={!action.trim() || !opKey.trim()}
          >
            APPROVE
          </button>
        </div>
        {approveError && <p style={styles.errorText}>{approveError}</p>}
        {lastResult && (
          <div style={{
            ...styles.resultBox,
            borderColor: lastResult.approved
              ? colors.primaryAccent
              : colors.error,
          }}>
            <div style={styles.configRow}>
              <span style={styles.configKey}>STATUS</span>
              <span style={{
                color: lastResult.approved ? colors.primaryAccent : colors.error,
                fontFamily: "monospace",
                fontWeight: typography.fontWeightBold,
                fontSize: typography.fontSizeSm,
              }}>
                {lastResult.approved ? "APPROVED" : "DENIED"}
              </span>
            </div>
            <div style={styles.configRow}>
              <span style={styles.configKey}>LEVEL</span>
              <span style={{ color: SEAL_COLOR[lastResult.seal_level] ?? colors.textPrimary, fontFamily: "monospace", fontSize: typography.fontSizeSm }}>
                {lastResult.seal_level}
              </span>
            </div>
            <p style={styles.reasonText}>{lastResult.reason}</p>
            {lastResult.token && (
              <p style={{ ...styles.reasonText, color: colors.secondaryAccent }}>
                Token: <code style={{ fontFamily: "monospace" }}>{lastResult.token}</code>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pending dual approvals */}
      {hasPending && (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>PENDING DUAL APPROVALS</span>
          {Object.entries(pending).map(([act, tokens]) => (
            <div key={act} style={styles.pendingRow}>
              <span style={{ ...styles.levelBadge, color: colors.secondaryAccent, borderColor: colors.secondaryAccent }}>
                DUAL
              </span>
              <span style={styles.actionPath}>{act}</span>
              <span style={styles.historyTs}>{tokens.length} token(s)</span>
            </div>
          ))}
        </div>
      )}

      {error && <p style={styles.errorText}>{error}</p>}
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
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.08em",
  },
  loading: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
  },
  pendingPulse: {
    color: colors.secondaryAccent,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    border: `1px solid ${colors.secondaryAccent}`,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    animation: "pulse 1.4s ease-in-out infinite",
  },
  section: { display: "grid", gap: spacing.sm },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  grid: {
    display: "grid",
    gap: "3px",
    maxHeight: 200,
    overflowY: "auto",
  },
  registryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.xs} ${spacing.sm}`,
    background: "#0a0f1e",
    borderRadius: radii.sm,
    border: `1px solid ${colors.borderColor}`,
    cursor: "pointer",
  },
  actionPath: {
    color: colors.textPrimary,
    fontSize: "0.7rem",
    fontFamily: "monospace",
    flex: 1,
  },
  levelBadge: {
    padding: `1px ${spacing.xs}`,
    borderRadius: radii.full,
    border: "1px solid",
    fontSize: "0.6rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.08em",
    whiteSpace: "nowrap",
    marginLeft: spacing.sm,
  },
  inputCol: {
    display: "grid",
    gap: spacing.sm,
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
  actionBtn: {
    background: "transparent",
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.md,
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    padding: `${spacing.sm} ${spacing.lg}`,
    whiteSpace: "nowrap",
  },
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  resultBox: {
    background: "#0a0f1e",
    border: "1px solid",
    borderRadius: radii.md,
    padding: spacing.md,
    display: "grid",
    gap: spacing.xs,
  },
  configRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  configKey: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  reasonText: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  pendingRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: "#0a0f1e",
    borderRadius: radii.sm,
    border: `1px solid ${colors.secondaryAccent}44`,
  },
  historyTs: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: "monospace",
  },
};
