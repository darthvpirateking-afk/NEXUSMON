import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { missionApi } from "../api/system";
import { setBridgeOutput } from "../hooks/useBridgeOutput";
import {
  type DisplayMission,
  isRealMissionPanelEnabled,
  mergeMissionPanelData,
} from "./missionPanelReadModel";

const REAL_MISSION_PANEL_ENABLED = isRealMissionPanelEnabled(
  import.meta.env.VITE_ENABLE_REAL_MISSION_PANEL,
);

const STATE_COLOR: Record<string, string> = {
  IDLE: colors.textSecondary,
  QUEUED: colors.warning,
  INITIALIZING: colors.restarting,
  RUNNING: colors.running,
  PAUSED: colors.warning,
  COMPLETED: colors.running,
  FAILED: colors.error,
  ABORTED: colors.error,
};

const PHASES = [
  "IDLE",
  "QUEUED",
  "INITIALIZING",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
];

function formatMissionTimestamp(timestamp?: string): string {
  if (!timestamp) return "Awaiting sync";
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return timestamp;
  return new Date(parsed).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summarizeMissionState(missions: DisplayMission[]) {
  return missions.reduce(
    (summary, mission) => {
      if (mission.state === "RUNNING") summary.running += 1;
      else if (["QUEUED", "INITIALIZING", "PAUSED"].includes(mission.state)) summary.queued += 1;
      else if (mission.state === "COMPLETED") summary.completed += 1;
      return summary;
    },
    { running: 0, queued: 0, completed: 0 },
  );
}

export function MissionLifecycleCard() {
  const [missions, setMissions] = useState<DisplayMission[]>([]);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevStatesRef = useRef<Record<string, string>>({});
  const missionSummary = summarizeMissionState(missions);

  const fetchMissions = useCallback(async () => {
    const lifecycleResult = await missionApi.status().catch(() => null);
    const readModelResult = REAL_MISSION_PANEL_ENABLED
      ? await missionApi.readModel().catch(() => null)
      : null;

    if (!lifecycleResult && !readModelResult) {
      return;
    }

    const next = mergeMissionPanelData({
      lifecycleMissions: lifecycleResult?.missions ?? [],
      readModelItems: readModelResult?.items ?? [],
      previousStates: prevStatesRef.current,
      includeReadModel: REAL_MISSION_PANEL_ENABLED,
    });

    for (const update of next.bridgeOutputs) {
      setBridgeOutput(update.message, update.mode, {
        backendBacked: update.backendBacked,
      });
    }

    prevStatesRef.current = next.previousStates;
    setMissions(next.missions);
  }, []);

  useEffect(() => {
    void fetchMissions();
    const id = setInterval(() => void fetchMissions(), 5000);
    return () => clearInterval(id);
  }, [fetchMissions]);

  const handleStart = useCallback(async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await missionApi.start(goal);
      setGoal("");
      await fetchMissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [goal, fetchMissions]);

  const handleAction = useCallback(
    async (action: "stop" | "pause" | "resume", missionId: string) => {
      try {
        await missionApi[action](missionId);
        await fetchMissions();
      } catch {
        // silent
      }
    },
    [fetchMissions],
  );

  return (
    <section style={styles.card}>
      <div style={styles.headerRow}>
        <div style={styles.headerCopy}>
          <span style={styles.eyebrow}>Mission Command</span>
          <h2 style={styles.title}>Truthful Lifecycle Feed</h2>
          <p style={styles.subtitle}>
            /api/missions now drives the primary mission list when the real-panel flag is enabled. Lifecycle polling remains a supplemental control and status overlay.
          </p>
        </div>
        <div style={styles.headerBadgeGroup}>
          <span style={styles.modeBadge}>{REAL_MISSION_PANEL_ENABLED ? "READ MODEL LIVE" : "LIFECYCLE ONLY"}</span>
          <span style={styles.pulseBadge}>{missions.length} TRACKED</span>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Lifecycle RUNNING</span>
          <strong style={{ ...styles.summaryValue, color: colors.running }}>{missionSummary.running}</strong>
          <span style={styles.summaryHint}>Execution not yet wired or engine-verified</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Queued</span>
          <strong style={{ ...styles.summaryValue, color: colors.warning }}>{missionSummary.queued}</strong>
          <span style={styles.summaryHint}>Pending, paused, or initializing</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Completed</span>
          <strong style={{ ...styles.summaryValue, color: colors.secondaryAccent }}>{missionSummary.completed}</strong>
          <span style={styles.summaryHint}>Recent mission completions</span>
        </div>
      </div>

      <div style={styles.launchPanel}>
        <div style={styles.launchCopy}>
          <span style={styles.launchLabel}>Launch Directive</span>
          <span style={styles.launchHint}>Dispatches a lifecycle mission immediately and refreshes the cockpit feed.</span>
        </div>
        <div style={styles.startRow}>
          <input
            style={styles.input}
            placeholder="Bind a mission goal to the runtime..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={loading}
          />
          <button
            style={styles.startBtn}
            onClick={() => void handleStart()}
            disabled={loading || !goal.trim()}
          >
            {loading ? "Launching" : "Launch"}
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.stepperShell}>
        <div style={styles.stepperHeader}>
          <span style={styles.stepperTitle}>Execution Rail</span>
          <span style={styles.stepperHint}>Canonical phase view</span>
        </div>
        <div style={styles.stepper}>
        {PHASES.map((phase, i) => (
          <div key={phase} style={styles.stepItem}>
            <div
              style={{
                ...styles.stepDot,
                background: STATE_COLOR[phase] ?? colors.textSecondary,
              }}
            />
            <span
              style={{
                ...styles.stepLabel,
                color: STATE_COLOR[phase] ?? colors.textSecondary,
              }}
            >
              {phase}
            </span>
            {i < PHASES.length - 1 && <div style={styles.stepLine} />}
          </div>
        ))}
      </div>
      </div>

      <div style={styles.missions}>
        {missions.length === 0 ? (
          <p style={styles.empty}>No active missions.</p>
        ) : (
          missions.slice(-5).map((m) => {
            const actionState = m.lifecycleState ?? m.state;
            return (
              <div
                key={m.mission_id}
                style={{
                  ...styles.missionRow,
                  boxShadow:
                    m.state === "RUNNING"
                      ? shadows.glow(colors.primaryAccent)
                      : m.state === "COMPLETED"
                        ? shadows.glow(colors.secondaryAccent)
                        : "none",
                }}
              >
                <div
                  style={{
                    ...styles.missionAccent,
                    background: STATE_COLOR[m.state] ?? colors.textSecondary,
                  }}
                />
                <div style={styles.missionBody}>
                  <div style={styles.missionTopRow}>
                    <div style={styles.missionMeta}>
                      <span style={styles.missionId}>{m.mission_id}</span>
                      {m.title && <span style={styles.missionTitle}>{m.title}</span>}
                    </div>
                    <div style={styles.missionStatusGroup}>
                      <span
                        style={{
                          ...styles.missionState,
                          color: STATE_COLOR[m.state] ?? colors.textSecondary,
                        }}
                      >
                        {m.state}
                      </span>
                      {REAL_MISSION_PANEL_ENABLED && (
                        <span style={styles.sourceBadge}>{m.sourceLabel}</span>
                      )}
                      {m.lifecycleState ? <span style={styles.sourceBadge}>LIFECYCLE {m.lifecycleState}</span> : null}
                      <span style={styles.truthBadge}>{m.executionLabel}</span>
                    </div>
                  </div>
                  <div style={styles.missionTelemetryRow}>
                    <span style={styles.telemetryChip}>{m.actionsEnabled ? "LIFECYCLE CONTROL" : "READ ONLY"}</span>
                    <span style={styles.telemetryTruthChip}>{m.executionDetail}</span>
                    {m.lifecycleDetail ? <span style={styles.telemetryChip}>{m.lifecycleDetail}</span> : null}
                    <span style={styles.telemetryChip}>{formatMissionTimestamp(m.updatedAt ?? m.createdAt)}</span>
                  </div>
                  <div style={styles.missionActions}>
                    {m.actionsEnabled && actionState === "RUNNING" && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => void handleAction("pause", m.mission_id)}
                      >
                        Pause
                      </button>
                    )}
                    {m.actionsEnabled && actionState === "PAUSED" && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => void handleAction("resume", m.mission_id)}
                      >
                        Resume
                      </button>
                    )}
                    {m.actionsEnabled && !["COMPLETED", "FAILED", "ABORTED"].includes(actionState) && (
                      <button
                        style={{ ...styles.actionBtn, ...styles.abortBtn }}
                        onClick={() => void handleAction("stop", m.mission_id)}
                      >
                        Abort
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.bg} 100%)`,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    display: "grid",
    gap: spacing.md,
    boxShadow: shadows.card,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  headerCopy: {
    display: "grid",
    gap: spacing.xs,
    maxWidth: "640px",
  },
  eyebrow: {
    color: colors.secondaryAccent,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
  },
  title: {
    margin: 0,
    fontSize: "1.45rem",
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: 0,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeMd,
    maxWidth: "58ch",
    lineHeight: 1.5,
  },
  headerBadgeGroup: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  modeBadge: {
    border: `1px solid ${colors.secondaryAccent}`,
    background: `${colors.secondaryAccent}18`,
    color: colors.secondaryAccent,
    borderRadius: radii.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
  },
  pulseBadge: {
    border: `1px solid ${colors.primaryAccent}`,
    background: `${colors.primaryAccent}16`,
    color: colors.primaryAccent,
    borderRadius: radii.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: spacing.sm,
  },
  summaryCard: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.bg} 100%)`,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },
  summaryValue: {
    fontSize: "1.7rem",
    fontFamily: typography.fontFamily,
    lineHeight: 1,
  },
  summaryHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  launchPanel: {
    display: "grid",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `linear-gradient(135deg, ${colors.primaryAccent}14 0%, ${colors.cardBg} 50%, ${colors.secondaryAccent}10 100%)`,
  },
  launchCopy: {
    display: "grid",
    gap: spacing.xs,
  },
  launchLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLg,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
  },
  launchHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  startRow: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 200px",
    padding: `${spacing.sm} ${spacing.md}`,
    background: `${colors.bg}D9`,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    minHeight: "44px",
  },
  startBtn: {
    padding: `${spacing.sm} ${spacing.lg}`,
    background: `${colors.primaryAccent}24`,
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.md,
    color: colors.primaryAccent,
    cursor: "pointer",
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    minHeight: "44px",
    boxShadow: shadows.glow(colors.primaryAccent),
  },
  stepperShell: {
    display: "grid",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `${colors.bg}B8`,
  },
  stepperHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  stepperTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightBold,
  },
  stepperHint: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    overflowX: "auto",
    padding: `${spacing.xs} 0`,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    flex: "0 0 auto",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    margin: `0 ${spacing.md}`,
  },
  stepLabel: {
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    marginTop: spacing.xs,
    letterSpacing: "0.06em",
  },
  stepLine: {
    position: "absolute",
    top: 5,
    right: `-${spacing.md}`,
    width: spacing.md,
    height: 1,
    background: colors.borderColor,
  },
  missions: {
    display: "grid",
    gap: spacing.sm,
  },
  missionRow: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "4px minmax(0, 1fr)",
    gap: spacing.md,
    alignItems: "center",
    padding: `${spacing.sm} ${spacing.md}`,
    background: `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.bg} 100%)`,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
  },
  missionAccent: {
    alignSelf: "stretch",
    borderRadius: radii.full,
    minHeight: "100%",
  },
  missionBody: {
    display: "grid",
    gap: spacing.sm,
    minWidth: 0,
  },
  missionTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  missionMeta: {
    display: "grid",
    gap: spacing.xs,
    minWidth: 0,
    flex: "1 1 240px",
  },
  missionId: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  missionState: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightBold,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.05em",
  },
  missionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLg,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
  },
  missionStatusGroup: {
    display: "grid",
    justifyItems: "end",
    gap: spacing.xs,
  },
  sourceBadge: {
    color: colors.textSecondary,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    fontFamily: typography.fontFamily,
  },
  truthBadge: {
    color: colors.warning,
    border: `1px solid ${colors.warning}55`,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    fontFamily: typography.fontFamily,
    background: `${colors.warning}12`,
  },
  missionTelemetryRow: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  telemetryChip: {
    color: colors.textSecondary,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    background: `${colors.bg}A6`,
  },
  telemetryTruthChip: {
    color: colors.warning,
    border: `1px solid ${colors.warning}44`,
    borderRadius: radii.full,
    padding: `2px ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    background: `${colors.warning}12`,
  },
  missionActions: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: `${spacing.xs} ${spacing.sm}`,
    background: `${colors.primaryAccent}12`,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
    color: colors.textPrimary,
    cursor: "pointer",
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  abortBtn: {
    background: `${colors.error}12`,
    borderColor: `${colors.error}66`,
  },
  error: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radii.md,
    border: `1px solid ${colors.error}55`,
    background: `${colors.error}10`,
  },
  empty: {
    margin: 0,
    color: colors.textSecondary,
    textAlign: "center",
    padding: spacing.lg,
    fontFamily: typography.fontFamily,
    border: `1px dashed ${colors.borderColor}`,
    borderRadius: radii.md,
    background: `${colors.bg}B8`,
  },
};
