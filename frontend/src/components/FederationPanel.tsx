import { type CSSProperties, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useFederation, type AgentResult } from "../hooks/useFederation";

const STATUS_COLOR: Record<string, string> = {
  complete: colors.primaryAccent,
  error: colors.error,
};

const MODE_COLOR: Record<string, string> = {
  strategic: colors.primaryAccent,
  combat: colors.secondaryAccent,
  guardian: colors.warning,
};

function AgentResultRow({ result }: { result: AgentResult }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[result.status] ?? colors.textSecondary;

  return (
    <div style={styles.resultRow}>
      <div style={styles.resultHeader} onClick={() => setExpanded((v) => !v)}>
        <span style={{ ...styles.statusDot, background: color, boxShadow: `0 0 6px ${color}88` }} />
        <span style={{ ...styles.agentId }}>{result.agent_id}</span>
        <span style={{ ...styles.modeBadge, color: MODE_COLOR[result.mode] ?? colors.textSecondary, borderColor: MODE_COLOR[result.mode] ?? colors.borderColor }}>
          {result.mode}
        </span>
        <span style={{ ...styles.statusLabel, color }}>{result.status}</span>
        <span style={styles.metaChip}>{result.latency_ms.toFixed(0)}ms</span>
        <span style={styles.metaChip}>{result.tokens}t</span>
        <span style={styles.expandToggle}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={styles.resultBody}>
          {result.output && <pre style={styles.outputPre}>{result.output}</pre>}
          {result.error && <pre style={{ ...styles.outputPre, color: colors.error }}>{result.error}</pre>}
        </div>
      )}
    </div>
  );
}

export function FederationPanel() {
  const {
    agents,
    loading,
    coordinating,
    lastResult,
    error,
    register,
    coordinate,
    fetchAgents,
  } = useFederation();

  const [goal, setGoal] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentMode, setNewAgentMode] = useState("strategic");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!newAgentId.trim()) return;
    setRegisterError(null);
    const data = await register(newAgentId.trim(), newAgentMode);
    if (data?.error) {
      setRegisterError(String(data.error));
    } else {
      setNewAgentId("");
    }
  };

  const handleCoordinate = async () => {
    if (!goal.trim()) return;
    await coordinate(goal.trim());
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>FEDERATION COUNCIL</span>
        <div style={styles.headerRight}>
          <span style={styles.agentCount}>{agents.length} AGENTS</span>
          <button style={styles.refreshBtn} onClick={() => void fetchAgents()} disabled={loading}>
            {loading ? "…" : "↺"}
          </button>
        </div>
      </div>

      {/* Registered agents list */}
      <div style={styles.agentList}>
        {agents.length === 0 && (
          <p style={styles.emptyText}>No agents registered. Register one below.</p>
        )}
        {agents.map((agent) => (
          <div key={agent.agent_id} style={styles.agentRow}>
            <span style={styles.agentIdText}>{agent.agent_id}</span>
            <span style={{
              ...styles.modeBadge,
              color: MODE_COLOR[agent.mode] ?? colors.textSecondary,
              borderColor: MODE_COLOR[agent.mode] ?? colors.borderColor,
            }}>
              {agent.mode}
            </span>
          </div>
        ))}
      </div>

      {/* Register agent */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>REGISTER AGENT</span>
        <div style={styles.inputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Agent ID"
            value={newAgentId}
            onChange={(e) => setNewAgentId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleRegister()}
          />
          <select
            style={styles.select}
            value={newAgentMode}
            onChange={(e) => setNewAgentMode(e.target.value)}
          >
            <option value="strategic">strategic</option>
            <option value="combat">combat</option>
          </select>
          <button
            style={{
              ...styles.actionBtn,
              opacity: !newAgentId.trim() ? 0.5 : 1,
              cursor: !newAgentId.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleRegister()}
            disabled={!newAgentId.trim()}
          >
            REGISTER
          </button>
        </div>
        {registerError && <p style={styles.errorText}>{registerError}</p>}
      </div>

      {/* Coordinate */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>COORDINATE</span>
        <div style={styles.inputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Coordination goal…"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCoordinate()}
            disabled={coordinating}
          />
          <button
            style={{
              ...styles.actionBtn,
              borderColor: colors.secondaryAccent,
              color: colors.secondaryAccent,
              opacity: coordinating || !goal.trim() || agents.length === 0 ? 0.5 : 1,
              cursor: coordinating || !goal.trim() || agents.length === 0 ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleCoordinate()}
            disabled={coordinating || !goal.trim() || agents.length === 0}
          >
            {coordinating ? "COORDINATING…" : "COORDINATE"}
          </button>
        </div>
        {agents.length === 0 && goal.trim() && (
          <p style={styles.hintText}>Register at least one agent to coordinate.</p>
        )}
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {/* Last coordination result */}
      {lastResult && (
        <div style={styles.section}>
          <div style={styles.resultMeta}>
            <span style={styles.sectionLabel}>LAST COORDINATION</span>
            <span style={styles.fedId}>{lastResult.federation_id}</span>
          </div>
          <div style={styles.resultList}>
            {lastResult.agent_results.map((r, i) => (
              <AgentResultRow key={`${r.agent_id}-${i}`} result={r} />
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.08em",
  },
  agentCount: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  refreshBtn: {
    background: "transparent",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.primaryAccent,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontSize: "1rem",
    padding: `${spacing.xs} ${spacing.sm}`,
    minHeight: 30,
    minWidth: 30,
  },
  agentList: {
    display: "grid",
    gap: spacing.xs,
    minHeight: 32,
  },
  emptyText: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
  },
  agentRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: radii.sm,
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
  },
  agentIdText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    flex: 1,
  },
  modeBadge: {
    padding: `1px ${spacing.xs}`,
    borderRadius: radii.full,
    border: "1px solid",
    fontSize: "0.6rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.08em",
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
  inputRow: {
    display: "flex",
    gap: spacing.sm,
    alignItems: "center",
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
  select: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
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
  errorText: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  hintText: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
  },
  resultMeta: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
  },
  fedId: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  resultList: {
    display: "grid",
    gap: spacing.xs,
  },
  resultRow: {
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  resultHeader: {
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
  agentId: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    flex: 1,
  },
  statusLabel: {
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  metaChip: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: "monospace",
  },
  expandToggle: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
  },
  resultBody: {
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
    maxHeight: 180,
    overflowY: "auto",
  },
};
