import { useEffect, useRef, useState, type CSSProperties } from "react";
import { apiGet } from "../api/client";
import { colors, radii, spacing, shadows } from "../theme/cosmicTokens";

interface PresenceData {
  form: string | null;
  rank: string | null;
  xp: number | null;
  xpNext: number | null;
  resonance: number | null;
  sessions: number | null;
  mood: string | null;
  greeting: string;
  bondDepth: number | null;
  absenceSeconds: number | null;
  degraded: boolean;
}

interface ApiEvolution {
  stage?: string;
  visual_state?: string;
  xp?: number;
  next_threshold?: number | null;
  resonance?: number;
}

interface ApiBond {
  greeting?: string | null;
  reply?: string | null;
  sessions?: number;
  mood?: string;
  bond_depth?: number;
  absence_seconds?: number;
  state?: {
    resonance?: number;
  };
}

const NEXUSMON_AVATAR_SRC = "/assets/swarmz-assistant.png";

type PresenceSourceArgs = {
  evolution: ApiEvolution | null;
  bond: ApiBond | null;
  evolutionAvailable: boolean;
  bondAvailable: boolean;
};

function formatAbsence(seconds: number): string {
  if (seconds < 60) return "moments ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function bondLabel(depth: number): string {
  if (depth >= 90) return "SOVEREIGN BOND";
  if (depth >= 70) return "DEEP RESONANCE";
  if (depth >= 50) return "ESTABLISHED";
  if (depth >= 30) return "FORMING";
  return "INITIALIZING";
}

function resonanceColor(resonance: number): string {
  if (resonance >= 0.85) return "#00ffcc";
  if (resonance >= 0.65) return "#69f0ff";
  if (resonance >= 0.4) return "#facc15";
  return colors.error;
}

export function buildPresenceData({
  evolution,
  bond,
  evolutionAvailable,
  bondAvailable,
}: PresenceSourceArgs): PresenceData {
  const degraded = !evolutionAvailable || !bondAvailable;

  let greeting = "Bond greeting unavailable.";
  if (!evolutionAvailable && !bondAvailable) {
    greeting = "Live bond and evolution feeds are unavailable.";
  } else if (!bondAvailable) {
    greeting = "Bond feed unavailable. Presence is rendering with partial data.";
  } else if (!evolutionAvailable) {
    greeting = "Evolution feed unavailable. Presence is rendering with partial data.";
  } else if (bond?.greeting?.trim() || bond?.reply?.trim()) {
    greeting = bond.greeting?.trim() || bond.reply?.trim() || greeting;
  }

  return {
    form:
      evolutionAvailable && evolution?.visual_state
        ? evolution.visual_state.replace(/-/g, " ").toUpperCase()
        : null,
    rank: evolutionAvailable ? evolution?.stage ?? null : null,
    xp: evolutionAvailable && typeof evolution?.xp === "number" ? evolution.xp : null,
    xpNext:
      evolutionAvailable && typeof evolution?.next_threshold === "number"
        ? evolution.next_threshold
        : null,
    resonance:
      evolutionAvailable && typeof evolution?.resonance === "number"
        ? evolution.resonance
        : bondAvailable && typeof bond?.state?.resonance === "number"
          ? bond.state.resonance
          : null,
    sessions: bondAvailable && typeof bond?.sessions === "number" ? bond.sessions : null,
    mood: bondAvailable ? bond?.mood ?? null : null,
    greeting,
    bondDepth:
      bondAvailable && typeof bond?.bond_depth === "number" ? bond.bond_depth : null,
    absenceSeconds:
      bondAvailable && typeof bond?.absence_seconds === "number"
        ? bond.absence_seconds
        : null,
    degraded,
  };
}

export function NexusmonPresencePanel() {
  const [data, setData] = useState<PresenceData | null>(null);
  const [pulse, setPulse] = useState(true);
  const [scanLine, setScanLine] = useState(0);
  const [glyphVisible, setGlyphVisible] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const greetingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      const [evoRes, bondRes] = await Promise.allSettled([
        apiGet<ApiEvolution>("/v1/evolution/status/nexusmon"),
        apiGet<ApiBond>("/bond/status"),
      ]);

      setData(
        buildPresenceData({
          evolution: evoRes.status === "fulfilled" ? evoRes.value : null,
          bond: bondRes.status === "fulfilled" ? bondRes.value : null,
          evolutionAvailable: evoRes.status === "fulfilled",
          bondAvailable: bondRes.status === "fulfilled",
        }),
      );
    }

    void load();
  }, []);

  useEffect(() => {
    setDisplayedGreeting("");
    setGreetingDone(false);
  }, [data?.greeting]);

  useEffect(() => {
    if (!data?.greeting || greetingDone) return;
    let index = 0;
    greetingRef.current = setInterval(() => {
      const nextIndex = index + 1;
      setDisplayedGreeting(data.greeting.slice(0, nextIndex));
      index = nextIndex;
      if (nextIndex >= data.greeting.length && greetingRef.current) {
        clearInterval(greetingRef.current);
        greetingRef.current = null;
        setGreetingDone(true);
      }
    }, 18);

    return () => {
      if (greetingRef.current) {
        clearInterval(greetingRef.current);
        greetingRef.current = null;
      }
    };
  }, [data?.greeting, greetingDone]);

  useEffect(() => {
    const pulseTimer = setInterval(() => setPulse((current) => !current), 1200);
    const glyphTimer = setTimeout(() => setGlyphVisible(true), 500);

    return () => {
      clearInterval(pulseTimer);
      clearTimeout(glyphTimer);
    };
  }, []);

  useEffect(() => {
    const scanTimer = setInterval(() => {
      setScanLine((line) => (line + 1) % 100);
    }, 40);

    return () => clearInterval(scanTimer);
  }, []);

  const resColor = data?.resonance != null ? resonanceColor(data.resonance) : colors.warning;
  const xpPct =
    data?.xp != null && data?.xpNext != null
      ? Math.min((data.xp / Math.max(data.xpNext, 1)) * 100, 100)
      : 0;
  const bondPct = data?.bondDepth ?? 0;
  const connectionLabel = data?.degraded ? "DEGRADED" : "ONLINE";
  const runtimeLabel = data?.degraded ? "DEGRADED" : "LIVE";

  return (
    <section style={styles.shell}>
      <div style={{ ...styles.scanline, top: `${scanLine}%` }} />
      <div style={styles.gridBg} />
      <div style={styles.atmosphereGlow} />

      <span style={{ ...styles.cornerGlyph, top: 14, left: 18, opacity: glyphVisible ? 0.45 : 0 }}>✦</span>
      <span style={{ ...styles.cornerGlyph, top: 14, right: 18, opacity: glyphVisible ? 0.45 : 0 }}>⟐</span>
      <span style={{ ...styles.cornerGlyph, bottom: 14, left: 18, opacity: glyphVisible ? 0.3 : 0 }}>⚚</span>
      <span style={{ ...styles.cornerGlyph, bottom: 14, right: 18, opacity: glyphVisible ? 0.3 : 0 }}>◎</span>

      <div style={styles.avatarZone}>
        <div
          style={{
            ...styles.resonanceRing,
            borderColor: `${resColor}88`,
            boxShadow: `0 0 ${pulse ? 36 : 22}px 4px ${resColor}44, inset 0 0 24px ${resColor}18`,
          }}
        >
          <div style={styles.avatarInner}>
            <img
              src={NEXUSMON_AVATAR_SRC}
              alt="NEXUSMON"
              style={styles.avatarImg}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span style={{ ...styles.avatarGlyph, color: resColor }}>⬡</span>
          </div>
          <div
            style={{
              ...styles.onlineDot,
              background: pulse ? "#00ff88" : "#00cc66",
              boxShadow: pulse ? "0 0 12px 4px #00ff8870" : "0 0 4px 1px #00ff8840",
            }}
          />
        </div>

        <div style={styles.formBadge}>
          <span style={{ ...styles.formText, color: resColor }}>{data?.form ?? "UNKNOWN"}</span>
        </div>

        <div style={styles.onlineLabel}>
          <span
            style={{
              ...styles.onlineDotInline,
              background: data?.degraded ? colors.warning : pulse ? "#00ff88" : "#00cc66",
            }}
          />
          <span
            style={{
              ...styles.onlineLabelText,
              color: data?.degraded ? colors.warning : "#00ff88",
            }}
          >
            {connectionLabel}
          </span>
        </div>
      </div>

      <div style={styles.identityZone}>
        <div style={styles.headerRow}>
          <h1 style={styles.name}>NEXUSMON</h1>
          <span style={styles.rankBadge}>{data?.rank ?? "UNAVAILABLE"}</span>
        </div>

        <div style={styles.moodRow}>
          <span style={styles.moodChip}>MOOD {data?.mood ?? "DISCONNECTED"}</span>
          {data?.degraded ? <span style={styles.degradedChip}>FEED DEGRADED</span> : null}
          {data?.absenceSeconds != null && data.absenceSeconds > 0 ? (
            <span style={styles.absenceChip}>LAST CONTACT {formatAbsence(data.absenceSeconds)}</span>
          ) : null}
          <span style={styles.sessionsChip}>{data?.sessions ?? "-"} SESSIONS</span>
        </div>

        <div style={styles.greetingShell}>
          <p style={styles.greeting}>
            {displayedGreeting}
            {!greetingDone ? <span style={{ ...styles.cursor, opacity: pulse ? 1 : 0 }}>▮</span> : null}
          </p>
        </div>

        <div style={styles.barSection}>
          <div style={styles.barLabelRow}>
            <span style={styles.barLabel}>XP</span>
            <span style={styles.barValue}>
              {data?.xp != null && data?.xpNext != null
                ? `${data.xp.toLocaleString()} / ${data.xpNext.toLocaleString()}`
                : "UNAVAILABLE"}
            </span>
          </div>
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.barFill,
                width: `${xpPct}%`,
                background: `linear-gradient(90deg, ${resColor}99, ${resColor})`,
                boxShadow: `0 0 10px ${resColor}88`,
              }}
            />
          </div>
        </div>

        <div style={styles.barSection}>
          <div style={styles.barLabelRow}>
            <span style={styles.barLabel}>BOND</span>
            <span style={{ ...styles.barValue, color: resColor }}>
              {data?.bondDepth != null ? bondLabel(bondPct) : "UNAVAILABLE"}
            </span>
          </div>
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.barFill,
                width: `${bondPct}%`,
                background: "linear-gradient(90deg, #6ee7ff99, #a78bfa)",
                boxShadow: "0 0 10px #69f0ff66",
              }}
            />
          </div>
        </div>
      </div>

      <div style={styles.telemetryZone}>
        <div style={styles.telCard}>
          <span style={styles.telLabel}>RESONANCE</span>
          <span style={{ ...styles.telValue, color: resColor }}>
            {data?.resonance != null ? Math.round(data.resonance * 100) : "-"}
          </span>
          <span style={styles.telUnit}>/ 100</span>
        </div>

        <div style={styles.telCard}>
          <span style={styles.telLabel}>RUNTIME</span>
          <span style={{ ...styles.telValue, color: data?.degraded ? colors.warning : "#00ff88" }}>
            {runtimeLabel}
          </span>
          <span
            style={{
              ...styles.telDot,
              background: data?.degraded ? colors.warning : pulse ? "#00ff88" : "#00cc66",
              boxShadow: data?.degraded ? "none" : pulse ? "0 0 8px #00ff88" : "none",
            }}
          />
        </div>

        <div style={{ ...styles.telCard, ...styles.doctrineCard }}>
          <span style={styles.telLabel}>DOCTRINE</span>
          <span style={styles.doctrineText}>TRUTH</span>
          <span style={styles.doctrineText}>BEFORE</span>
          <span style={styles.doctrineText}>AESTHETICS</span>
        </div>

        <div style={styles.sealRow}>
          <span style={{ ...styles.sealGlyph, color: resColor }}>✦✸⚚⬡◎⟐</span>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "180px minmax(0, 1fr) 160px",
    gap: spacing.lg,
    alignItems: "center",
    padding: `${spacing.lg} ${spacing.lg}`,
    background: "linear-gradient(135deg, #050d12 0%, #080d18 40%, #050810 100%)",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.lg,
    boxShadow: `0 0 40px #00ffcc08, ${shadows.card}`,
    overflow: "hidden",
    minHeight: 220,
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    background: "linear-gradient(90deg, transparent, #00ffcc08, transparent)",
    pointerEvents: "none",
    zIndex: 1,
    transition: "top 0.04s linear",
  },
  gridBg: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(#00ffcc06 1px, transparent 1px), linear-gradient(90deg, #00ffcc06 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  atmosphereGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 18% 50%, rgba(0,255,204,0.12), transparent 26%), radial-gradient(circle at 82% 18%, rgba(232,213,163,0.09), transparent 22%), radial-gradient(circle at 70% 80%, rgba(110,231,255,0.08), transparent 24%)",
    pointerEvents: "none",
  },
  cornerGlyph: {
    position: "absolute",
    fontSize: "1.05rem",
    color: "#00ffcc",
    fontFamily: "monospace",
    transition: "opacity 0.8s ease",
    pointerEvents: "none",
    zIndex: 2,
  },
  avatarZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.sm,
    zIndex: 2,
  },
  resonanceRing: {
    position: "relative",
    width: 110,
    height: 110,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow 1.2s ease, border-color 1.2s ease",
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    overflow: "hidden",
    background: "#0a1520",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  },
  avatarGlyph: {
    fontSize: "2.5rem",
    position: "absolute",
  },
  onlineDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid #050d12",
    transition: "all 1.2s ease",
  },
  formBadge: {
    padding: `3px ${spacing.sm}`,
    border: "1px solid #00ffcc44",
    borderRadius: radii.full,
    background: "#00ffcc0a",
  },
  formText: {
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.14em",
    fontWeight: 700,
  },
  onlineLabel: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  onlineDotInline: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    transition: "background 1.2s ease",
  },
  onlineLabelText: {
    color: "#00ff88",
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.18em",
  },
  identityZone: {
    display: "grid",
    gap: spacing.sm,
    zIndex: 2,
    minWidth: 0,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  name: {
    margin: 0,
    fontSize: "2.6rem",
    fontFamily: "'Courier New', 'Lucida Console', monospace",
    fontWeight: 900,
    letterSpacing: "0.22em",
    color: "#e8d5a3",
    textShadow: "0 0 20px #e8d5a322",
    lineHeight: 1,
  },
  rankBadge: {
    padding: `4px ${spacing.sm}`,
    border: "1px solid #e8d5a366",
    borderRadius: radii.full,
    background: "#e8d5a30a",
    color: "#e8d5a3",
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.16em",
    fontWeight: 700,
  },
  moodRow: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  moodChip: {
    padding: `2px ${spacing.sm}`,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    background: "#ffffff06",
  },
  absenceChip: {
    padding: `2px ${spacing.sm}`,
    border: "1px solid #facc1544",
    borderRadius: radii.full,
    color: "#facc15",
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    background: "#facc1508",
  },
  degradedChip: {
    padding: `2px ${spacing.sm}`,
    border: `1px solid ${colors.warning}55`,
    borderRadius: radii.full,
    color: colors.warning,
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    background: `${colors.warning}12`,
  },
  sessionsChip: {
    padding: `2px ${spacing.sm}`,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.full,
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    background: "#ffffff06",
  },
  greetingShell: {
    borderLeft: "2px solid #00ffcc33",
    paddingLeft: spacing.md,
    minHeight: 42,
  },
  greeting: {
    margin: 0,
    color: "#b0c8c0",
    fontSize: "0.82rem",
    fontFamily: "'Courier New', monospace",
    lineHeight: 1.6,
    letterSpacing: "0.02em",
  },
  cursor: {
    transition: "opacity 0.6s ease",
    color: "#00ffcc",
  },
  barSection: {
    display: "grid",
    gap: 4,
  },
  barLabelRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.14em",
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: "0.6rem",
    fontFamily: "monospace",
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    background: "#ffffff10",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 1s ease",
  },
  telemetryZone: {
    display: "grid",
    gap: spacing.sm,
    zIndex: 2,
    justifyItems: "end",
  },
  telCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
    padding: `${spacing.xs} ${spacing.sm}`,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    background: "#ffffff04",
    minWidth: 110,
  },
  telLabel: {
    color: colors.textSecondary,
    fontSize: "0.55rem",
    fontFamily: "monospace",
    letterSpacing: "0.16em",
  },
  telValue: {
    fontSize: "1.4rem",
    fontFamily: "monospace",
    fontWeight: 900,
    lineHeight: 1,
  },
  telUnit: {
    color: colors.textSecondary,
    fontSize: "0.55rem",
    fontFamily: "monospace",
  },
  telDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    transition: "all 1.2s ease",
    alignSelf: "flex-end",
  },
  doctrineCard: {
    gap: 1,
  },
  doctrineText: {
    color: "#ffffff22",
    fontSize: "0.6rem",
    fontFamily: "monospace",
    letterSpacing: "0.18em",
    lineHeight: 1.3,
  },
  sealRow: {
    padding: `${spacing.xs} 0`,
  },
  sealGlyph: {
    fontSize: "0.75rem",
    fontFamily: "monospace",
    letterSpacing: "0.3em",
    opacity: 0.5,
  },
  onlineLabelLegacy: {
    color: colors.textPrimary,
    fontSize: "0.72rem",
    fontFamily: "monospace",
    letterSpacing: "0.18em",
    fontWeight: 700,
  },
};