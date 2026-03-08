import { type CSSProperties, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useBondStatus } from "../hooks/useBondStatus";
import { useOperatorMemory } from "../hooks/useOperatorMemory";

const RELATIONSHIP_COLOR: Record<string, string> = {
  ROOKIE: colors.textSecondary,
  TRUSTED: colors.primaryAccent,
  SOVEREIGN: colors.warning,
};

export function OperatorMemoryPanel() {
  const { memory, greeting, loading, error, locked, lockStatus, addNote, addMilestone } =
    useOperatorMemory();
  const { bond, loading: bondLoading, error: bondError } = useBondStatus();

  const [noteInput, setNoteInput] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

  const relState = memory?.relationship_state ?? "ROOKIE";
  const relColor = RELATIONSHIP_COLOR[relState] ?? colors.textSecondary;
  const noteDisabled = locked || !noteInput.trim();
  const milestoneDisabled = locked || !milestoneInput.trim();
  const primaryGreeting = bond?.reply?.trim() || greeting;
  const showBondMeta = Boolean(bond && !bondError);

  const handleAddNote = async () => {
    if (noteDisabled) return;
    setNoteError(null);
    const data = await addNote(noteInput.trim());
    if (data?.error) {
      setNoteError(String(data.error));
    } else {
      setNoteInput("");
    }
  };

  const handleAddMilestone = async () => {
    if (milestoneDisabled) return;
    setMilestoneError(null);
    const data = await addMilestone(milestoneInput.trim());
    if (data?.error) {
      setMilestoneError(String(data.error));
    } else {
      setMilestoneInput("");
    }
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.nameRow}>
          <span
            style={{
              ...styles.relBadge,
              color: relColor,
              borderColor: relColor,
              boxShadow: `0 0 8px ${relColor}44`,
            }}
          >
            {relState}
          </span>
          <h2 style={styles.title}>{memory?.name ?? "OPERATOR"}</h2>
        </div>
        {loading || bondLoading ? <span style={styles.loadingDot}>...</span> : null}
      </div>

      {locked ? (
        <div style={styles.lockBanner}>
          <span style={styles.lockTitle}>OPERATOR LOCK ACTIVE</span>
          <span style={styles.lockBody}>
            Memory routes are silent until a valid operator key is provided.
          </span>
          {lockStatus?.bound ? (
            <span style={styles.lockMeta}>
              Bound to {lockStatus.operator ?? "unknown operator"}
              {lockStatus.since
                ? ` since ${new Date(lockStatus.since).toLocaleString()}`
                : ""}
            </span>
          ) : null}
        </div>
      ) : null}

      {primaryGreeting ? <p style={{ ...styles.greeting, color: relColor }}>{primaryGreeting}</p> : null}
      {showBondMeta ? (
        <div style={styles.bondMetaRow}>
          <span style={styles.bondMetaPill}>ABSENCE {bond?.absence_label ?? "-"}</span>
          <span style={styles.bondMetaPill}>MOOD {bond?.state.mood ?? "-"}</span>
          <span style={styles.bondMetaPill}>FORM {bond?.state.form ?? "-"}</span>
          <span style={styles.bondMetaPill}>OPEN {bond?.unfinished_count ?? 0}</span>
        </div>
      ) : null}
      {error ? <p style={styles.errorText}>{error}</p> : null}
      {bondError && !primaryGreeting ? <p style={styles.errorText}>{bondError}</p> : null}

      {memory ? (
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>SESSIONS</span>
            <span style={{ ...styles.statValue, color: relColor }}>
              {memory.session_count}
            </span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>MISSIONS</span>
            <span style={{ ...styles.statValue, color: colors.primaryAccent }}>
              {memory.total_missions}
            </span>
          </div>
          <div style={{ ...styles.statBox, flex: 2 }}>
            <span style={styles.statLabel}>LAST SEEN</span>
            <span style={styles.statValueMono}>
              {memory.last_seen ? new Date(memory.last_seen).toLocaleString() : "-"}
            </span>
          </div>
        </div>
      ) : null}

      {memory && memory.milestones.length > 0 ? (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>MILESTONES</span>
          <div style={styles.milestoneList}>
            {memory.milestones.map((milestone, index) => (
              <div key={`${milestone}-${index}`} style={styles.milestoneRow}>
                <span
                  style={{
                    ...styles.milestoneDot,
                    background: colors.primaryAccent,
                    boxShadow: `0 0 6px ${colors.primaryAccent}88`,
                  }}
                />
                <span style={styles.milestoneText}>{milestone}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.section}>
        <span style={styles.sectionLabel}>MARK MILESTONE</span>
        <div style={styles.inputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Record a permanent moment..."
            value={milestoneInput}
            onChange={(event) => setMilestoneInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void handleAddMilestone()}
            disabled={locked}
          />
          <button
            style={{
              ...styles.actionBtn,
              opacity: milestoneDisabled ? 0.5 : 1,
              cursor: milestoneDisabled ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleAddMilestone()}
            disabled={milestoneDisabled}
          >
            MARK
          </button>
        </div>
        {milestoneError ? <p style={styles.errorText}>{milestoneError}</p> : null}
      </div>

      <div style={styles.section}>
        <span style={styles.sectionLabel}>OPERATOR NOTE</span>
        <div style={styles.inputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Leave a note for NEXUSMON..."
            value={noteInput}
            onChange={(event) => setNoteInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void handleAddNote()}
            disabled={locked}
          />
          <button
            style={{
              ...styles.actionBtn,
              borderColor: colors.secondaryAccent,
              color: colors.secondaryAccent,
              opacity: noteDisabled ? 0.5 : 1,
              cursor: noteDisabled ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleAddNote()}
            disabled={noteDisabled}
          >
            SAVE
          </button>
        </div>
        {noteError ? <p style={styles.errorText}>{noteError}</p> : null}
        {memory?.operator_notes ? <pre style={styles.notesPre}>{memory.operator_notes}</pre> : null}
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  relBadge: {
    padding: `2px ${spacing.sm}`,
    borderRadius: radii.full,
    border: "1px solid",
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeXl,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.04em",
  },
  loadingDot: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeMd,
  },
  lockBanner: {
    display: "grid",
    gap: spacing.xs,
    border: `1px solid ${colors.error}`,
    borderRadius: radii.md,
    background: colors.bg,
    padding: spacing.md,
  },
  lockTitle: {
    color: colors.error,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  lockBody: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
  },
  lockMeta: {
    color: colors.textSecondary,
    fontFamily: "monospace",
    fontSize: typography.fontSizeSm,
  },
  greeting: {
    margin: 0,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    letterSpacing: "0.02em",
  },
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  bondMetaRow: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  bondMetaPill: {
    color: colors.textSecondary,
    border: `1px solid ${colors.borderColor}`,
    background: colors.bg,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  statsRow: {
    display: "flex",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    background: colors.bg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    padding: `${spacing.sm} ${spacing.md}`,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  statValue: {
    fontSize: typography.fontSizeLg,
    fontFamily: "monospace",
    fontWeight: typography.fontWeightBold,
  },
  statValueMono: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  section: {
    display: "grid",
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  milestoneList: {
    display: "grid",
    gap: spacing.xs,
  },
  milestoneRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  milestoneDot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  milestoneText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  inputRow: {
    display: "flex",
    gap: spacing.sm,
    alignItems: "center",
  },
  input: {
    background: colors.bg,
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
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    padding: `${spacing.sm} ${spacing.lg}`,
    whiteSpace: "nowrap",
  },
  notesPre: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: "0.72rem",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 120,
    overflowY: "auto",
    background: colors.bg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
};
