import { type CSSProperties, useState } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { useAutonomy } from "../hooks/useAutonomy";

const STATUS_COLOR: Record<string, string> = {
  pending: colors.warning,
  approved: colors.primaryAccent,
  rejected: colors.error,
};

export function AutonomyPanel() {
  const { queue, history, loading, error, approve, reject } = useAutonomy();

  const [opKey, setOpKey] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async (proposalId: string) => {
    setActionError(null);
    const data = await approve(proposalId, opKey);
    if (data?.error) setActionError(String(data.error));
  };

  const handleReject = async (proposalId: string) => {
    setActionError(null);
    const data = await reject(proposalId, rejectReason);
    if (data?.error) setActionError(String(data.error));
  };

  const resolvedHistory = history.filter((h) => h.status !== "pending").slice().reverse().slice(0, 5);

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>AUTONOMY ENGINE</span>
        {queue.length > 0 && (
          <span style={{ ...styles.badge, borderColor: `${colors.warning}66`, color: colors.warning }}>
            {queue.length} PENDING
          </span>
        )}
        {loading && <span style={styles.dim}>…</span>}
      </div>

      <p style={styles.doctrine}>
        NEXUSMON proposes — operator decides. No self-execution. Prime Directive holds.
      </p>

      {/* Operator key for decisions */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>OPERATOR KEY (for approvals)</span>
        <input
          style={{ ...styles.input, maxWidth: 320 }}
          placeholder="Operator key"
          type="password"
          value={opKey}
          onChange={(e) => setOpKey(e.target.value)}
        />
      </div>

      {/* Pending queue */}
      {queue.length > 0 ? (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>PENDING PROPOSALS ({queue.length})</span>
          <div style={styles.list}>
            {queue.map((p) => (
              <div key={p.proposal_id} style={styles.proposalCard}>
                <div style={styles.proposalHeader}>
                  <span style={styles.proposalTitle}>{p.title}</span>
                  <span style={styles.proposalId}>{p.proposal_id}</span>
                </div>
                {p.rationale && (
                  <p style={styles.rationale}>{p.rationale}</p>
                )}
                <div style={styles.stepsCount}>
                  {p.steps.length} step{p.steps.length !== 1 ? "s" : ""}
                </div>
                <div style={styles.actionRow}>
                  <input
                    style={{ ...styles.input, flex: 1, fontSize: "0.65rem" }}
                    placeholder="Reject reason (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <button
                    style={{ ...styles.actionBtn, borderColor: `${colors.error}88`, color: colors.error, opacity: !opKey ? 0.5 : 1 }}
                    onClick={() => void handleReject(p.proposal_id)}
                    disabled={!opKey}
                  >
                    REJECT
                  </button>
                  <button
                    style={{ ...styles.actionBtn, borderColor: colors.primaryAccent, color: colors.primaryAccent, opacity: !opKey ? 0.5 : 1 }}
                    onClick={() => void handleApprove(p.proposal_id)}
                    disabled={!opKey}
                  >
                    APPROVE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ ...styles.dim, fontStyle: "italic" }}>No pending proposals.</p>
      )}

      {actionError && <p style={styles.err}>{actionError}</p>}

      {/* Resolved history */}
      {resolvedHistory.length > 0 && (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>RECENT DECISIONS</span>
          <div style={styles.list}>
            {resolvedHistory.map((h) => (
              <div key={h.proposal_id} style={styles.histRow}>
                <span style={{ ...styles.statusDot, background: STATUS_COLOR[h.status] ?? colors.textSecondary }} />
                <span style={styles.histTitle}>{h.title}</span>
                <span style={{ ...styles.histStatus, color: STATUS_COLOR[h.status] ?? colors.textSecondary }}>
                  {h.status.toUpperCase()}
                </span>
                <span style={styles.dim}>
                  {h.decided_at ? new Date(h.decided_at).toLocaleTimeString() : ""}
                </span>
              </div>
            ))}
          </div>
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
  badge: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    border: "1px solid",
    borderRadius: radii.md,
    padding: `2px ${spacing.sm}`,
  },
  dim: { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.fontSizeSm },
  doctrine: {
    margin: 0,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: "0.65rem",
    fontStyle: "italic",
    letterSpacing: "0.04em",
  },
  section: { display: "grid", gap: spacing.sm },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.62rem",
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
  },
  list: { display: "grid", gap: spacing.sm },
  proposalCard: {
    background: "#07090f",
    border: `1px solid ${colors.warning}44`,
    borderRadius: radii.md,
    padding: spacing.md,
    display: "grid",
    gap: spacing.sm,
  },
  proposalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  proposalTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeMd,
    letterSpacing: "0.04em",
  },
  proposalId: {
    color: colors.textSecondary,
    fontFamily: "monospace",
    fontSize: "0.62rem",
  },
  rationale: {
    margin: 0,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    fontStyle: "italic",
  },
  stepsCount: {
    color: colors.primaryAccent,
    fontFamily: typography.fontFamily,
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
  },
  actionRow: { display: "flex", gap: spacing.sm, alignItems: "center" },
  actionBtn: {
    background: "transparent",
    border: "1px solid",
    borderRadius: radii.md,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.65rem",
    letterSpacing: "0.08em",
    padding: `${spacing.xs} ${spacing.md}`,
    whiteSpace: "nowrap",
  },
  histRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: "#0a0f1e",
    borderRadius: radii.sm,
    border: `1px solid ${colors.borderColor}`,
  },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  histTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily, fontSize: typography.fontSizeSm, flex: 1 },
  histStatus: { fontFamily: typography.fontFamily, fontWeight: typography.fontWeightBold, fontSize: "0.62rem", letterSpacing: "0.06em" },
  err: { margin: 0, color: colors.error, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamily },
};
