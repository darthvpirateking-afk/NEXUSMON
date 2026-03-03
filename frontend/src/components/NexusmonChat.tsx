import { type CSSProperties, useCallback, useRef, useState } from "react";
import { apiPost } from "../api/client";

type ChatMode = "strategic" | "combat" | "guardian";
type MsgRole = "operator" | "nexusmon" | "system" | "error";

interface ChatMsg {
  role: MsgRole;
  text: string;
  tier?: string;
  mode?: string;
}

const MODE_COLOR: Record<ChatMode, string> = {
  strategic: "#4EF2C5",
  combat:    "#FF6FD8",
  guardian:  "#FFB020",
};

const TIER_LABEL: Record<string, string> = {
  CORTEX:   "CORTEX",
  REFLEX:   "REFLEX",
  MONITOR:  "MONITOR",
  DEGRADED: "DEGRADED",
};

const ROLE_COLOR: Record<MsgRole, string> = {
  operator: "#00f0ff",
  nexusmon: "#a78bfa",
  system:   "#475569",
  error:    "#f87171",
};

interface CompanionResp {
  reply: string;
  mode: string;
  tier_used: string;
  tokens: number;
  latency_ms: number;
  error?: string;
}

export function NexusmonChat() {
  const [mode, setMode] = useState<ChatMode>("strategic");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMsg[]>([
    { role: "system", text: "NEXUSMON Companion online. Select mode and speak." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput("");

    const next: ChatMsg[] = [
      ...history,
      { role: "operator", text: prompt },
    ];
    setHistory(next);
    setLoading(true);

    setTimeout(scrollToBottom, 50);

    try {
      const resp = await apiPost<CompanionResp>("/v1/companion/nexusmon", {
        prompt,
        mode,
      });

      if (resp.error) {
        setHistory([...next, { role: "error", text: `[ERROR] ${resp.error}` }]);
      } else {
        const tier = TIER_LABEL[resp.tier_used] ?? resp.tier_used;
        setHistory([
          ...next,
          {
            role: "nexusmon",
            text: resp.reply,
            tier,
            mode: resp.mode,
          },
        ]);
      }
    } catch (err) {
      setHistory([
        ...next,
        { role: "error", text: `[ERROR] ${err instanceof Error ? err.message : "Request failed"}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [input, loading, history, mode, scrollToBottom]);

  const modeColor = MODE_COLOR[mode];

  return (
    <div style={styles.shell}>
      {/* Mode selector */}
      <div style={styles.modeBar}>
        <span style={styles.modeLabel}>MODE</span>
        {(["strategic", "combat", "guardian"] as ChatMode[]).map((m) => (
          <button
            key={m}
            style={{
              ...styles.modeBtn,
              color: mode === m ? MODE_COLOR[m] : "#475569",
              borderColor: mode === m ? MODE_COLOR[m] : "#1e293b",
              background: mode === m ? `${MODE_COLOR[m]}12` : "transparent",
            }}
            onClick={() => setMode(m)}
          >
            {m.toUpperCase()}
          </button>
        ))}
        {loading && <span style={styles.thinking}>▸ thinking…</span>}
      </div>

      {/* Message history */}
      <div ref={scrollRef} style={styles.history}>
        {history.map((msg, i) => (
          <div key={i} style={styles.msgRow}>
            {msg.role === "operator" && (
              <>
                <span style={{ ...styles.prefix, color: "#00f0ff" }}>operator&gt;</span>
                <span style={{ color: "#e2e8f0" }}>{msg.text}</span>
              </>
            )}
            {msg.role === "nexusmon" && (
              <div style={styles.nexusBlock}>
                <div style={styles.nexusHeader}>
                  <span style={{ color: modeColor, fontWeight: 700, fontSize: 10, letterSpacing: 2 }}>
                    NEXUSMON
                  </span>
                  {msg.tier && (
                    <span style={{ ...styles.tierBadge, color: modeColor, borderColor: modeColor }}>
                      {msg.tier}
                    </span>
                  )}
                </div>
                <span style={{ color: ROLE_COLOR.nexusmon, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </span>
              </div>
            )}
            {msg.role === "system" && (
              <span style={{ color: ROLE_COLOR.system, fontStyle: "italic" }}>{msg.text}</span>
            )}
            {msg.role === "error" && (
              <span style={{ color: ROLE_COLOR.error }}>{msg.text}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <span style={{ color: modeColor, fontWeight: 700, fontSize: 12, marginRight: 8, whiteSpace: "nowrap" }}>
          {mode}&gt;
        </span>
        <input
          style={styles.input}
          type="text"
          value={input}
          placeholder="speak to NEXUSMON…"
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
        />
        <button
          style={{ ...styles.sendBtn, borderColor: modeColor, color: modeColor, opacity: loading ? 0.4 : 1 }}
          onClick={() => void send()}
          disabled={loading}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    flexDirection: "column",
    background: "#0a0d12",
    border: "1px solid #141a24",
    borderRadius: 6,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    fontSize: 12,
    overflow: "hidden",
  },
  modeBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderBottom: "1px solid #141a24",
    flexWrap: "wrap",
  },
  modeLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#334155",
    marginRight: 4,
  },
  modeBtn: {
    background: "transparent",
    border: "1px solid",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  },
  thinking: {
    marginLeft: "auto",
    fontSize: 10,
    color: "#475569",
    fontStyle: "italic",
    animation: "pulse 1.2s ease-in-out infinite",
  },
  history: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 200,
    maxHeight: 340,
  },
  msgRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    lineHeight: 1.6,
  },
  prefix: {
    fontWeight: 700,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  nexusBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  nexusHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  tierBadge: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.5,
    border: "1px solid",
    borderRadius: 3,
    padding: "1px 5px",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid #141a24",
    padding: "8px 12px",
    background: "#080b10",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e2e8f0",
    fontFamily: "inherit",
    fontSize: 12,
  },
  sendBtn: {
    background: "transparent",
    border: "1px solid",
    borderRadius: 4,
    padding: "3px 8px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    marginLeft: 8,
    transition: "opacity 0.15s",
  },
};
