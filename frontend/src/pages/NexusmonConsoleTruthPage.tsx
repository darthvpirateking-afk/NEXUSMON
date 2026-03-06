import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NexusmonChat } from "../components/NexusmonChat";
import { useEvolution } from "../hooks/useEvolution";

type Severity = "info" | "warn" | "success";

type HealthPayload = {
  status?: string;
  subsystems?: Record<string, string>;
};

type AgentsPayload = {
  agents?: Record<string, unknown>[];
};

type AuditPayload = {
  entries?: Record<string, unknown>[];
};

type TerminalEntryType = "system" | "input" | "output" | "warn" | "error";

interface TerminalEntry {
  type: TerminalEntryType;
  text: string;
}

interface LiveModule {
  id: string;
  label: string;
  icon: string;
  desc: string;
  status: string;
  color: string;
}

interface LiveAgent {
  id: string;
  label: string;
  role: string;
  status: string;
}

interface MissionEvent {
  type: string;
  msg: string;
  agent: string;
  severity: Severity;
  ts: string;
}

const STAGE_COLOR: Record<string, string> = {
  ORIGIN: "#9CA3AF",
  EMBODIMENT: "#4EF2C5",
  EXECUTION_FRAME: "#FFB020",
  MONARCH_SHELL: "#FFD700",
  ZERO_POINT: "#FF6FD8",
};

const SUBSYSTEM_META: Record<string, { icon: string; desc: string }> = {
  database: { icon: "◈", desc: "Mission and state persistence" },
  bridge: { icon: "◎", desc: "LLM routing and provider bridge" },
  governance: { icon: "◉", desc: "Policy gate and approvals" },
  orchestrator: { icon: "⬡", desc: "Mission orchestration runtime" },
  avatar: { icon: "◇", desc: "Evolution and avatar state" },
};

const TERM_COLORS: Record<TerminalEntryType, string> = {
  system: "#475569",
  input: "#00f0ff",
  output: "#94a3b8",
  warn: "#fbbf24",
  error: "#f87171",
};

function subsystemColor(status: string): string {
  if (status === "ok") return "#34d399";
  if (status === "degraded") return "#fbbf24";
  if (status === "error") return "#f87171";
  return "#64748b";
}

function statusSeverity(status: string): Severity {
  if (status.includes("fail") || status.includes("error") || status.includes("deny")) {
    return "warn";
  }
  if (status.includes("complete") || status.includes("pass") || status.includes("seal")) {
    return "success";
  }
  return "info";
}

function buildModules(subsystems: Record<string, string>): LiveModule[] {
  return Object.entries(subsystems).map(([name, status]) => {
    const meta = SUBSYSTEM_META[name] ?? { icon: "◆", desc: `Runtime subsystem: ${name}` };
    return {
      id: name,
      label: name.replace(/[_-]+/g, " ").toUpperCase(),
      icon: meta.icon,
      desc: meta.desc,
      status,
      color: subsystemColor(status),
    };
  });
}

function mapAgent(agent: Record<string, unknown>): LiveAgent {
  const rawId = String(agent.id ?? "unknown");
  const shortId = rawId.split("@")[0];
  const capabilities = Array.isArray(agent.capabilities) ? agent.capabilities.map(String) : [];
  return {
    id: rawId,
    label: shortId.toUpperCase().replace(/-/g, "_"),
    role: capabilities.slice(0, 2).join(" / ") || "Agent",
    status: capabilities.length > 0 ? "active" : "watching",
  };
}

function mapEvent(entry: Record<string, unknown>): MissionEvent {
  const eventType = String(entry.event_type ?? "info");
  const timestamp = String(entry.timestamp ?? "");
  const data = ((entry.data ?? entry.payload ?? {}) as Record<string, unknown>);
  const ts = timestamp.includes("T")
    ? timestamp.split("T")[1].split(".")[0].replace("Z", "")
    : new Date().toISOString().split("T")[1].split(".")[0];
  const missionId = entry.mission_id ? `M-${String(entry.mission_id).slice(-6)}` : "";
  let msg = `${eventType} ${missionId}`.trim();
  if (eventType === "xp_awarded") {
    msg = `XP +${data.xp_delta ?? "?"} — rank ${data.new_rank ?? "?"} ${missionId}`.trim();
  } else if (eventType === "governance") {
    msg = `Governance: ${String(data.result ?? "?")} — type: ${String(data.mission_type ?? "?")} ${missionId}`.trim();
  } else if (eventType === "worker_assigned") {
    msg = `Worker ${String(data.worker ?? "?")} assigned ${missionId}`.trim();
  } else if (eventType === "artifact_sealed") {
    msg = `Artifact sealed ${String(data.artifact_id ?? "").slice(-8)} ${missionId}`.trim();
  } else if (eventType === "status_change") {
    msg = `Status → ${String(data.status ?? "?")} ${missionId}`.trim();
  }
  return {
    type: eventType,
    msg,
    agent: data.worker ? String(data.worker) : "UNKNOWN",
    severity: statusSeverity(eventType),
    ts,
  };
}

function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8, marginRight: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: color, animation: "pulse 2s ease-in-out infinite" }} />
      <span style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `1px solid ${color}`, opacity: 0.4, animation: "pulse-ring 2s ease-in-out infinite" }} />
    </span>
  );
}

export function NexusmonConsoleTruthPage() {
  const [modules, setModules] = useState<LiveModule[]>([]);
  const [healthStatus, setHealthStatus] = useState("unknown");
  const [healthUpdatedAt, setHealthUpdatedAt] = useState<string | null>(null);
  const [agents, setAgents] = useState<LiveAgent[]>([]);
  const [events, setEvents] = useState<MissionEvent[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([
    { type: "system", text: "NEXUSMON Operator Console v2.2.0" },
    { type: "system", text: "Live console bound to backend health, audit, and agent surfaces." },
    { type: "system", text: 'Type "help" for available commands.' },
  ]);
  const [organismPulse, setOrganismPulse] = useState(0);
  const [stageFlash, setStageFlash] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const auditSeenRef = useRef<Set<string>>(new Set());
  const termRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const prevStageRef = useRef<string | null>(null);

  const { stage, xp } = useEvolution();
  const stageColor = STAGE_COLOR[stage] ?? "#4EF2C5";

  useEffect(() => {
    if (prevStageRef.current !== null && prevStageRef.current !== stage) {
      setStageFlash(true);
      const id = setTimeout(() => setStageFlash(false), 2000);
      return () => clearTimeout(id);
    }
    prevStageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const step = Math.max(1, Math.floor(xp / 1000) + 1);
    const id = setInterval(() => setOrganismPulse((value) => (value + step) % 360), 3000);
    return () => clearInterval(id);
  }, [xp]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health/deep");
        if (!res.ok) throw new Error(`health ${res.status}`);
        const payload = (await res.json()) as HealthPayload;
        const subsystems = payload.subsystems ?? {};
        setModules(buildModules(subsystems));
        setHealthStatus(String(payload.status ?? "unknown"));
        setHealthUpdatedAt(new Date().toLocaleTimeString());
      } catch {
        setModules([]);
        setHealthStatus("offline");
        setHealthUpdatedAt(null);
      }
    };
    void fetchHealth();
    const id = setInterval(() => void fetchHealth(), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/v1/agents");
        if (!res.ok) throw new Error(`agents ${res.status}`);
        const payload = (await res.json()) as AgentsPayload;
        const rawAgents = Array.isArray(payload.agents) ? payload.agents : [];
        setAgents(rawAgents.map(mapAgent));
      } catch {
        setAgents([]);
      }
    };
    void fetchAgents();
    const id = setInterval(() => void fetchAgents(), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch("/api/audit");
        if (!res.ok) throw new Error(`audit ${res.status}`);
        const payload = (await res.json()) as AuditPayload;
        const entries = Array.isArray(payload.entries) ? payload.entries : [];
        const newEvents: MissionEvent[] = [];
        for (const entry of entries) {
          const key = `${String(entry.timestamp ?? "")}-${String(entry.event_type ?? "")}`;
          if (!auditSeenRef.current.has(key)) {
            auditSeenRef.current.add(key);
            newEvents.push(mapEvent(entry));
          }
        }
        if (newEvents.length > 0) {
          setEvents((current) => [...newEvents.reverse(), ...current].slice(0, 80));
        }
        setAuditError(null);
      } catch (error) {
        setAuditError(error instanceof Error ? error.message : "audit unavailable");
      }
    };
    void fetchAudit();
    const id = setInterval(() => void fetchAudit(), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminalHistory]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events]);

  const handleCommand = useCallback((rawCommand: string) => {
    const command = rawCommand.trim().toLowerCase();
    const next: TerminalEntry[] = [...terminalHistory, { type: "input", text: `operator> ${rawCommand}` }];

    if (command === "help") {
      next.push({ type: "output", text: "Available commands:" });
      next.push({ type: "output", text: "  status        — backend subsystem snapshot" });
      next.push({ type: "output", text: "  agents        — registered live agents" });
      next.push({ type: "output", text: "  events        — recent audit events" });
      next.push({ type: "output", text: "  clear         — clear terminal" });
    } else if (command === "status") {
      next.push({ type: "output", text: `HEALTH STATUS: ${healthStatus.toUpperCase()}` });
      if (modules.length === 0) {
        next.push({ type: "warn", text: "  No live subsystem snapshot available." });
      } else {
        modules.forEach((module) => {
          next.push({ type: "output", text: `  ${module.icon} ${module.label.padEnd(14)} ${module.status}` });
        });
      }
      next.push({ type: "output", text: `  Last health poll: ${healthUpdatedAt ?? "unavailable"}` });
    } else if (command === "agents") {
      next.push({ type: "output", text: "REGISTERED AGENTS:" });
      if (agents.length === 0) {
        next.push({ type: "warn", text: "  No live agents returned from /v1/agents." });
      } else {
        agents.forEach((agent) => {
          next.push({ type: "output", text: `  ${agent.label.padEnd(14)} [${agent.status.padEnd(8)}] ${agent.role}` });
        });
      }
    } else if (command === "events") {
      next.push({ type: "output", text: "RECENT AUDIT EVENTS:" });
      if (events.length === 0) {
        next.push({ type: "warn", text: `  ${auditError ?? "No audit events loaded from /api/audit."}` });
      } else {
        events.slice(0, 5).forEach((event) => {
          next.push({ type: "output", text: `  ${event.ts} ${event.type} ${event.msg}` });
        });
      }
    } else if (command === "clear") {
      setTerminalHistory([{ type: "system", text: "Terminal cleared. Ready." }]);
      setCommandInput("");
      return;
    } else if (command !== "") {
      next.push({ type: "warn", text: "No live command endpoint is exposed for that action in this console." });
    }

    setTerminalHistory(next);
    setCommandInput("");
  }, [agents, auditError, events, healthStatus, healthUpdatedAt, modules, terminalHistory]);

  const okModules = modules.filter((module) => module.status === "ok").length;
  const overallState = healthStatus === "ok" ? "NOMINAL" : healthStatus === "degraded" ? "DEGRADED" : "OFFLINE";
  const pulseColor = healthStatus === "ok" ? "#34d399" : healthStatus === "degraded" ? "#fbbf24" : "#f87171";

  const connectionStats = useMemo(
    () => [
      { label: "HEALTH", value: healthStatus.toUpperCase(), color: pulseColor },
      { label: "AGENTS", value: String(agents.length), color: agents.length > 0 ? "#34d399" : "#64748b" },
      { label: "AUDIT", value: String(events.length), color: events.length > 0 ? "#34d399" : "#64748b" },
      { label: "LAST POLL", value: healthUpdatedAt ?? "--", color: "#64748b" },
    ],
    [agents.length, events.length, healthStatus, healthUpdatedAt, pulseColor],
  );

  return (
    <div style={{ background: "#06080c", color: "#c8d6e5", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", height: "100%", fontSize: 13, position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .nx-module-card:hover { border-color: var(--nx-accent) !important; background: rgba(255,255,255,0.03) !important; }
        .nx-event-row { animation: fadeIn 0.3s ease-out; }
        .nx-cmd-input:focus { outline: none; }
      `}</style>

      <div style={{ borderBottom: "1px solid #141a24", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,8,12,0.95)", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 4, color: "#00f0ff", textShadow: "0 0 20px rgba(0,240,255,0.3)" }}>
            NEXUSMON
          </div>
          <div style={{ width: 1, height: 20, background: "#1e293b" }} />
          <span style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Operator Console</span>
          <div style={{ width: 1, height: 20, background: "#1e293b" }} />
          <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: stageColor, fontWeight: 600 }}>{stage}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
          {stageFlash && <span style={{ color: stageColor, fontWeight: 700, letterSpacing: 2 }}>▲ STAGE ADVANCE</span>}
          <Pulse color={pulseColor} />
          <span style={{ color: pulseColor, fontWeight: 600 }}>ORGANISM {overallState}</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ color: "#64748b" }}>Subsystems {okModules}/{modules.length}</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ color: "#64748b" }}>Agents {agents.filter((agent) => agent.status === "active").length}/{agents.length}</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ color: "#64748b" }}>Audit {events.length}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 340px", height: "calc(100% - 49px)" }}>
        <div style={{ borderRight: "1px solid #141a24", padding: 16, overflowY: "auto", background: "rgba(6,8,12,0.6)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#475569", textTransform: "uppercase", marginBottom: 16 }}>Live Subsystems</div>
          {modules.length === 0 && <div style={{ color: "#475569", fontSize: 11, marginBottom: 12 }}>No subsystem snapshot available from /api/health/deep.</div>}
          {modules.map((module) => (
            <div
              key={module.id}
              className="nx-module-card"
              onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
              style={{ ["--nx-accent" as string]: module.color, border: `1px solid ${selectedModule === module.id ? module.color : "#141a24"}`, borderRadius: 6, padding: 12, marginBottom: 8, cursor: "pointer", background: selectedModule === module.id ? "rgba(255,255,255,0.02)" : "transparent", transition: "all 0.2s ease" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: module.color, fontSize: 14 }}>{module.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: 1.5, color: "#e2e8f0" }}>{module.label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Orbitron', sans-serif", color: module.color }}>{module.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{module.desc}</div>
              <div style={{ fontSize: 10, color: module.color, opacity: 0.7 }}>▸ status: {module.status}</div>
              {selectedModule === module.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${module.color}22`, fontSize: 10, color: "#94a3b8" }}>
                  <div style={{ marginBottom: 4 }}>Last poll: {healthUpdatedAt ?? "unavailable"}</div>
                  <div>Source: /api/health/deep</div>
                </div>
              )}
            </div>
          ))}

          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#475569", textTransform: "uppercase", marginTop: 24, marginBottom: 12 }}>Registered Agents</div>
          {agents.length === 0 && <div style={{ color: "#475569", fontSize: 11, marginBottom: 12 }}>No live agent registry response from /v1/agents.</div>}
          {agents.map((agent) => (
            <div key={agent.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #0d1117" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 11, color: "#e2e8f0", letterSpacing: 1 }}>{agent.label}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{agent.role}</div>
              </div>
              <span style={{ color: agent.status === "active" ? "#34d399" : "#fbbf24", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{agent.status}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", background: "#080b10", position: "relative" }}>
          <div style={{ height: 140, borderBottom: "1px solid #141a24", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.03, background: "radial-gradient(ellipse at center, #00f0ff 0%, transparent 70%)" }} />
            <svg width="240" height="120" viewBox="0 0 240 120" style={{ opacity: 0.8 }}>
              {modules.map((module, index) => {
                const cx = 40 + index * 36;
                const cy = 60 + Math.sin((organismPulse + index * 60) * Math.PI / 180) * 12;
                const nextCy = 60 + Math.sin((organismPulse + (index + 1) * 60) * Math.PI / 180) * 12;
                return (
                  <g key={module.id}>
                    <circle cx={cx} cy={cy} r={14} fill="none" stroke={module.color} strokeWidth={1} opacity={0.8} />
                    <circle cx={cx} cy={cy} r={6} fill={module.color} opacity={0.35} />
                    <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={module.color} fontSize={8} fontFamily="monospace">{module.icon}</text>
                    {index < modules.length - 1 && <line x1={cx + 14} y1={cy} x2={cx + 22} y2={nextCy} stroke="#1e293b" strokeWidth={1} strokeDasharray="3,3" />}
                  </g>
                );
              })}
              {modules.length === 0 && <text x={120} y={60} textAnchor="middle" fill="#334155" fontSize={10} fontFamily="monospace">awaiting backend health snapshot</text>}
              <text x={120} y={108} textAnchor="middle" fill="#334155" fontSize={9} fontFamily="'Orbitron', monospace" letterSpacing={3}>ORGANISM STATE</text>
            </svg>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "hidden" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#475569", textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Operator Terminal</span>
              <span style={{ color: "#334155", fontWeight: 400 }}>live introspection only</span>
            </div>

            <div ref={termRef} style={{ flex: 1, overflowY: "auto", marginBottom: 12, background: "#0a0d12", border: "1px solid #141a24", borderRadius: 6, padding: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
              {terminalHistory.map((entry, index) => (
                <div key={index} style={{ color: TERM_COLORS[entry.type], whiteSpace: "pre-wrap" }}>{entry.text}</div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", background: "#0a0d12", border: "1px solid #141a24", borderRadius: 6, padding: "8px 12px" }}>
              <span style={{ color: "#00f0ff", marginRight: 8, fontSize: 12, fontWeight: 600 }}>operator&gt;</span>
              <input
                className="nx-cmd-input"
                type="text"
                value={commandInput}
                onChange={(event) => setCommandInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") handleCommand(commandInput); }}
                placeholder="type a command..."
                style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              />
            </div>

            <div style={{ borderTop: "1px solid #141a24", paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#475569", textTransform: "uppercase", marginBottom: 8 }}>Companion</div>
              <NexusmonChat />
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #141a24", display: "flex", flexDirection: "column", background: "rgba(6,8,12,0.6)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #141a24", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#475569", textTransform: "uppercase" }}>Mission Feed</span>
            <span style={{ fontSize: 10, color: "#334155" }}>{events.length} events</span>
          </div>

          <div ref={feedRef} style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {events.length === 0 && <div style={{ color: "#334155", fontSize: 11, textAlign: "center", marginTop: 40 }}>{auditError ?? "Awaiting audit events..."}</div>}
            {events.map((event, index) => (
              <div key={`${event.ts}-${index}`} className="nx-event-row" style={{ padding: "10px 12px", marginBottom: 6, borderRadius: 4, background: "#0a0d12", borderLeft: `2px solid ${subsystemColor(event.severity === "success" ? "ok" : event.severity === "warn" ? "degraded" : "unknown")}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: event.severity === "success" ? "#34d399" : event.severity === "warn" ? "#fbbf24" : "#64748b" }}>{event.type}</span>
                  <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace" }}>{event.ts}</span>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 4 }}>{event.msg}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>agent: {event.agent}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #141a24", padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "#475569", textTransform: "uppercase", marginBottom: 12 }}>Backend Truth</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {connectionStats.map((stat) => (
                <div key={stat.label} style={{ background: "#0a0d12", borderRadius: 4, padding: "8px 10px", border: "1px solid #141a24" }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#475569" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: "8px 10px", background: "#0a0d12", borderRadius: 4, border: "1px solid #141a24", fontSize: 10 }}>
              <div style={{ color: "#475569", marginBottom: 4 }}>CONSOLE CONTRACT</div>
              <div style={{ color: "#94a3b8" }}>This surface renders only live health, agent, and audit data. If the backend does not return it, the console stays empty and says so.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}