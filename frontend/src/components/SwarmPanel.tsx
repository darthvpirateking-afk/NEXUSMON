import { type CSSProperties, useState } from "react";
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from "../theme/cosmicTokens";
import { useSwarm, type AgentState } from "../hooks/useSwarm";

const STATUS_COLOR: Record<string, string> = {
  complete: colors.primaryAccent,
  error: colors.error,
  running: colors.warning,
};

function AgentResultRow({ agent }: { agent: AgentState }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[agent.status] ?? colors.textSecondary;

  return (
    <div style={styles.resultRow}>
      <div style={styles.resultHeader} onClick={() => setExpanded((v) => !v)}>
        <span style={{ ...styles.statusDot, background: color, boxShadow: `0 0 6px ${color}88` }} />
        <span style={{ ...styles.resultLabel, color }}>{agent.status.toUpperCase()}</span>
        <span style={styles.resultAgent}>{agent.agent_id}</span>
        <span style={styles.resultMeta}>{agent.mode}</span>
        <span style={styles.resultMeta}>{agent.latency_ms.toFixed(0)}ms</span>
        <span style={styles.resultMeta}>{agent.tokens}t</span>
        <span style={styles.expandToggle}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={styles.resultBody}>
          {agent.output && <pre style={styles.outputPre}>{agent.output}</pre>}
          {agent.error && <pre style={{ ...styles.outputPre, color: colors.error }}>{agent.error}</pre>}
        </div>
      )}
    </div>
  );
}

export function SwarmPanel() {
  const { spawning, lastResult, error, spawn } = useSwarm();
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState("strategic");
  const [agentId, setAgentId] = useState("swarm-agent");

  const handleSpawn = async () => {
    if (!goal.trim()) return;
    await spawn(goal.trim(), mode, agentId.trim() || "swarm-agent");
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>SWARM COMMAND</span>
        <span style={styles.badge}>SWARM</span>
      </div>

      <div style={styles.inputGroup}>
        <input
          style={styles.input}
          placeholder="Mission goal…"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSpawn()}
          disabled={spawning}
        />
        <div style={styles.inputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Agent ID"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={spawning}
          />
          <select
            style={styles.select}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={spawning}
          >
            <option value="strategic">strategic</option>
            <option value="combat">combat</option>
          </select>
          <button
            style={{
              ...styles.spawnBtn,
              opacity: spawning || !goal.trim() ? 0.5 : 1,
              cursor: spawning || !goal.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleSpawn()}
            disabled={spawning || !goal.trim()}
          >
            {spawning ? "SPAWNING…" : "SPAWN"}
          </button>
        </div>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {lastResult && (
        <div style={styles.result}>
          <div style={styles.resultMetaRow}>
            <span style={styles.metaKey}>SWARM</span>
            <span style={styles.metaVal}>{lastResult.swarm_id}</span>
          </div>
          <AgentResultRow agent={lastResult.agent} />
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
  badge: {
    padding: `2px ${spacing.sm}`,
    borderRadius: radii.full,
    border: `1px solid ${colors.primaryAccent}`,
    color: colors.primaryAccent,
    fontSize: "0.65rem",
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
  },
  inputGroup: {
    display: "grid",
    gap: spacing.sm,
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
  spawnBtn: {
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
  result: {
    display: "grid",
    gap: spacing.sm,
  },
  resultMetaRow: {
    display: "flex",
    gap: spacing.sm,
    alignItems: "center",
  },
  metaKey: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
  },
  metaVal: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
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
    width: 8,
    height: 8,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  resultLabel: {
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
    minWidth: 64,
  },
  resultAgent: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    flex: 1,
  },
  resultMeta: {
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
    maxHeight: 200,
    overflowY: "auto",
  },
};
