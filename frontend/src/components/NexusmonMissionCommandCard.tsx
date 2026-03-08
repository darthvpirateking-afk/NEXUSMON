import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { missionApi, type MissionStatus } from "../api/system";
import { setBridgeOutput } from "../hooks/useBridgeOutput";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { type NexusmonMode } from "./NexusmonModeSelector";
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

const MODE_COLOR: Record<NexusmonMode, string> = {
  strategic: "#00f0ff",
  combat: "#a78bfa",
  guardian: "#fbbf24",
};

function formatTimestamp(timestamp?: string): string {
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

export function NexusmonMissionCommandCard({ mode }: { mode: NexusmonMode }) {
  const [missions, setMissions] = useState<DisplayMission[]>([]);
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("default");
  const [loading, setLoading] = useState(false);
  const [actionMissionId, setActionMissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedLifecycleMission, setSelectedLifecycleMission] = useState<MissionStatus | null>(null);
  const prevStatesRef = useRef<Record<string, string>>({});
  const missionSummary = useMemo(() => summarizeMissionState(missions), [missions]);
  const modeColor = MODE_COLOR[mode];

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
    setSelectedMissionId((current) => {
      if (current && next.missions.some((mission) => mission.mission_id === current)) {
        return current;
      }
      return next.missions[0]?.mission_id ?? null;
    });
  }, []);

  useEffect(() => {
    void fetchMissions();
    const intervalId = setInterval(() => void fetchMissions(), 5000);
    return () => clearInterval(intervalId);
  }, [fetchMissions]);

  useEffect(() => {
    if (!selectedMissionId) {
      setSelectedLifecycleMission(null);
      return;
    }

    const selectedMission = missions.find((mission) => mission.mission_id === selectedMissionId);
    if (!selectedMission?.actionsEnabled) {
      setSelectedLifecycleMission(null);
      return;
    }

    let cancelled = false;
    void missionApi.statusById(selectedMissionId)
      .then((mission) => {
        if (!cancelled) {
          setSelectedLifecycleMission(mission);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedLifecycleMission(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [missions, selectedMissionId]);

  const handleLaunch = useCallback(async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await missionApi.start(goal.trim(), category.trim() || "default", mode);
      setGoal("");
      setSelectedMissionId(response.mission_id);
      await fetchMissions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mission launch failed.");
    } finally {
      setLoading(false);
    }
  }, [category, fetchMissions, goal, loading, mode]);

  const handleAction = useCallback(
    async (action: "stop" | "pause" | "resume", missionId: string) => {
      setActionMissionId(missionId);
      setError(null);
      try {
        await missionApi[action](missionId);
        await fetchMissions();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : `Mission ${action} failed.`);
      } finally {
        setActionMissionId(null);
      }
    },
    [fetchMissions],
  );

  const selectedMission = missions.find((mission) => mission.mission_id === selectedMissionId) ?? null;
  const selectedStateColor = STATE_COLOR[selectedMission?.state ?? "IDLE"] ?? colors.textSecondary;
  const selectedActionState = selectedLifecycleMission?.state ?? selectedMission?.lifecycleState ?? selectedMission?.state ?? "IDLE";

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <span style={styles.eyebrow}>Mission Command</span>
          <h2 style={styles.title}>Runtime Rail</h2>
          <p style={styles.subtitle}>
            /api/missions is the primary cockpit feed. Lifecycle polling stays connected only to overlay live status and expose controls when a mission is present on that rail.
          </p>
        </div>
        <div style={styles.badges}>
          <span style={{ ...styles.modeBadge, color: modeColor, borderColor: `${modeColor}66` }}>
            {mode.toUpperCase()} LAUNCH MODE
          </span>
          <span style={styles.countBadge}>{missions.length} TRACKED</span>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Runtime RUNNING</span>
          <strong style={{ ...styles.summaryValue, color: colors.running }}>{missionSummary.running}</strong>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Queued</span>
          <strong style={{ ...styles.summaryValue, color: colors.warning }}>{missionSummary.queued}</strong>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Completed</span>
          <strong style={{ ...styles.summaryValue, color: colors.secondaryAccent }}>{missionSummary.completed}</strong>
        </div>
      </div>

      <div style={styles.launchPanel}>
        <div style={styles.launchGrid}>
          <label style={styles.inputGroup}>
            <span style={styles.inputLabel}>Goal</span>
            <input
              style={styles.input}
              placeholder="Bind a directive to the runtime..."
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={loading}
            />
          </label>
          <label style={styles.inputGroup}>
            <span style={styles.inputLabel}>Category</span>
            <input
              style={styles.input}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={loading}
            />
          </label>
          <button
            type="button"
            style={{
              ...styles.launchButton,
              borderColor: modeColor,
              color: modeColor,
              boxShadow: shadows.glow(modeColor),
              opacity: loading || !goal.trim() ? 0.6 : 1,
              cursor: loading || !goal.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => void handleLaunch()}
            disabled={loading || !goal.trim()}
          >
            {loading ? "Launching" : "Launch"}
          </button>
        </div>
        <span style={styles.launchHint}>
          Guardian mode still records the mission, but outbound bridge calls remain blocked by backend policy.
        </span>
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      <div style={styles.contentGrid}>
        <div style={styles.listColumn}>
          {missions.length === 0 ? (
            <div style={styles.emptyState}>No tracked missions yet.</div>
          ) : (
            missions.slice(0, 6).map((mission) => {
              const active = mission.mission_id === selectedMissionId;
              const accent = STATE_COLOR[mission.state] ?? colors.textSecondary;
              return (
                <button
                  key={mission.mission_id}
                  type="button"
                  style={{
                    ...styles.missionRow,
                    borderColor: active ? `${accent}88` : colors.borderColor,
                    background: active ? `${accent}12` : `${colors.cardBg}`,
                    boxShadow: active ? shadows.glow(accent) : "none",
                  }}
                  onClick={() => setSelectedMissionId(mission.mission_id)}
                >
                  <div style={styles.missionRowTop}>
                    <span style={{ ...styles.missionState, color: accent }}>{mission.state}</span>
                    <div style={styles.rowBadgeGroup}>
                      <span style={styles.sourceBadge}>{mission.sourceLabel}</span>
                      {mission.lifecycleState ? <span style={styles.sourceBadge}>LIFECYCLE {mission.lifecycleState}</span> : null}
                      <span style={styles.truthBadge}>{mission.executionLabel}</span>
                    </div>
                  </div>
                  <span style={styles.missionId}>{mission.mission_id}</span>
                  <span style={styles.missionTitle}>{mission.title}</span>
                  <span style={styles.truthDetail}>{mission.executionDetail}</span>
                  <span style={styles.timestamp}>{formatTimestamp(mission.updatedAt ?? mission.createdAt)}</span>
                </button>
              );
            })
          )}
        </div>

        <div style={styles.detailCard}>
          {!selectedMission ? (
            <div style={styles.emptyState}>Select a mission to inspect runtime detail.</div>
          ) : (
            <>
              <div style={styles.detailHeader}>
                <div style={styles.detailCopy}>
                  <span style={{ ...styles.missionState, color: selectedStateColor }}>{selectedMission.state}</span>
                  <h3 style={styles.detailTitle}>{selectedMission.title}</h3>
                  <span style={styles.detailId}>{selectedMission.mission_id}</span>
                </div>
                <div style={styles.rowBadgeGroup}>
                  <span style={styles.sourceBadge}>{selectedMission.sourceLabel}</span>
                  {selectedMission.lifecycleState ? <span style={styles.sourceBadge}>LIFECYCLE {selectedMission.lifecycleState}</span> : null}
                  <span style={styles.truthBadge}>{selectedMission.executionLabel}</span>
                </div>
              </div>

              <div style={styles.truthPanel}>
                <span style={styles.metaLabel}>Execution Truth</span>
                <p style={styles.truthPanelText}>{selectedMission.executionDetail}</p>
              </div>

              <div style={styles.metaGrid}>
                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Lifecycle State</span>
                  <span style={styles.metaValue}>{selectedLifecycleMission?.state ?? selectedMission.lifecycleState ?? "not linked"}</span>
                </div>
                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Launch Mode</span>
                  <span style={styles.metaValue}>{selectedLifecycleMission?.mode ?? "unbound"}</span>
                </div>
                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Category</span>
                  <span style={styles.metaValue}>{selectedLifecycleMission?.category ?? selectedMission.category ?? "unbound"}</span>
                </div>
                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Updated</span>
                  <span style={styles.metaValue}>{formatTimestamp(selectedMission.updatedAt ?? selectedMission.createdAt)}</span>
                </div>
              </div>

              {selectedLifecycleMission?.goal ? (
                <div style={styles.goalBox}>
                  <span style={styles.metaLabel}>Goal</span>
                  <p style={styles.goalText}>{selectedLifecycleMission.goal}</p>
                </div>
              ) : null}

              {selectedLifecycleMission?.history?.length ? (
                <div style={styles.historyBlock}>
                  <span style={styles.metaLabel}>History</span>
                  <div style={styles.historyList}>
                    {selectedLifecycleMission.history.map((entry, index) => (
                      <div key={`${entry.state}-${entry.timestamp}-${index}`} style={styles.historyRow}>
                        <span style={{ ...styles.historyState, color: STATE_COLOR[entry.state] ?? colors.textSecondary }}>
                          {entry.state}
                        </span>
                        <span style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={styles.actionRow}>
                {selectedMission.actionsEnabled && selectedActionState === "RUNNING" ? (
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={() => void handleAction("pause", selectedMission.mission_id)}
                    disabled={actionMissionId === selectedMission.mission_id}
                  >
                    Pause
                  </button>
                ) : null}
                {selectedMission.actionsEnabled && selectedActionState === "PAUSED" ? (
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={() => void handleAction("resume", selectedMission.mission_id)}
                    disabled={actionMissionId === selectedMission.mission_id}
                  >
                    Resume
                  </button>
                ) : null}
                {selectedMission.actionsEnabled && !["COMPLETED", "FAILED", "ABORTED"].includes(selectedActionState) ? (
                  <button
                    type="button"
                    style={{ ...styles.actionButton, ...styles.abortButton }}
                    onClick={() => void handleAction("stop", selectedMission.mission_id)}
                    disabled={actionMissionId === selectedMission.mission_id}
                  >
                    Abort
                  </button>
                ) : null}
                {!selectedMission.actionsEnabled ? (
                  <span style={styles.readOnlyNote}>No lifecycle control wire is present for this backend row yet.</span>
                ) : (
                  <span style={styles.readOnlyNote}>Lifecycle controls are attached to this canonical /api/missions row.</span>
                )}
              </div>
            </>
          )}
        </div>
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
    minHeight: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  headerCopy: {
    display: "grid",
    gap: spacing.xs,
    maxWidth: "40rem",
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
    color: colors.textPrimary,
    fontSize: typography.fontSizeXl,
    fontFamily: typography.fontFamily,
  },
  subtitle: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
  },
  badges: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  modeBadge: {
    border: "1px solid",
    borderRadius: radii.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    background: `${colors.bg}CC`,
  },
  countBadge: {
    border: `1px solid ${colors.primaryAccent}`,
    borderRadius: radii.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    letterSpacing: "0.12em",
    color: colors.primaryAccent,
    background: `${colors.primaryAccent}14`,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: spacing.sm,
  },
  summaryCard: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `${colors.bg}B8`,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  summaryValue: {
    fontSize: "1.5rem",
    fontFamily: typography.fontFamily,
    lineHeight: 1,
  },
  launchPanel: {
    display: "grid",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `linear-gradient(135deg, ${colors.primaryAccent}10 0%, ${colors.cardBg} 100%)`,
  },
  launchGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(120px, 0.6fr) auto",
    gap: spacing.sm,
    alignItems: "end",
  },
  inputGroup: {
    display: "grid",
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  input: {
    minHeight: 42,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `${colors.bg}D9`,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
  },
  launchButton: {
    minHeight: 42,
    padding: `${spacing.sm} ${spacing.lg}`,
    border: "1px solid",
    borderRadius: radii.md,
    background: "transparent",
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
  },
  launchHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  error: {
    margin: 0,
    color: colors.error,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 0.9fr) minmax(0, 1.1fr)",
    gap: spacing.md,
    minHeight: 0,
  },
  listColumn: {
    display: "grid",
    gap: spacing.sm,
    alignContent: "start",
    maxHeight: 420,
    overflowY: "auto",
    paddingRight: spacing.xs,
  },
  missionRow: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    border: "1px solid",
    cursor: "pointer",
    textAlign: "left",
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
  },
  missionRowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "center",
  },
  rowBadgeGroup: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  missionState: {
    fontSize: "0.65rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  sourceBadge: {
    color: colors.textSecondary,
    fontSize: "0.58rem",
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  truthBadge: {
    color: colors.warning,
    fontSize: "0.58rem",
    fontFamily: typography.fontFamily,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  missionId: {
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  missionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.4,
  },
  truthDetail: {
    color: colors.warning,
    fontSize: "0.7rem",
    fontFamily: typography.fontFamily,
    lineHeight: 1.4,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: "0.65rem",
    fontFamily: "monospace",
  },
  detailCard: {
    display: "grid",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: `${colors.bg}B8`,
    minHeight: 0,
    alignContent: "start",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  detailCopy: {
    display: "grid",
    gap: spacing.xs,
  },
  detailTitle: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeLg,
    fontFamily: typography.fontFamily,
  },
  detailId: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: "monospace",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: spacing.sm,
  },
  truthPanel: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    border: `1px solid ${colors.warning}44`,
    background: `${colors.warning}12`,
  },
  truthPanelText: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
  },
  metaBox: {
    display: "grid",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: colors.cardBg,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  goalBox: {
    display: "grid",
    gap: spacing.xs,
  },
  goalText: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    lineHeight: 1.5,
  },
  historyBlock: {
    display: "grid",
    gap: spacing.xs,
  },
  historyList: {
    display: "grid",
    gap: spacing.xs,
    maxHeight: 150,
    overflowY: "auto",
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: `${spacing.xs} 0`,
    borderBottom: `1px solid ${colors.borderColor}`,
  },
  historyState: {
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
  },
  actionRow: {
    display: "flex",
    gap: spacing.sm,
    flexWrap: "wrap",
    alignItems: "center",
  },
  actionButton: {
    minHeight: 38,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radii.md,
    border: `1px solid ${colors.borderColor}`,
    background: colors.cardBg,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    cursor: "pointer",
  },
  abortButton: {
    borderColor: `${colors.error}66`,
    color: colors.error,
  },
  readOnlyNote: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
};