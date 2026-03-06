import { useCallback, useRef, useState } from "preact/hooks";

type ChatMode = "strategic" | "combat" | "guardian";
type MsgRole = "operator" | "nexusmon" | "system" | "error";

interface ChatMsg {
  role: MsgRole;
  text: string;
  tier?: string;
}

const MODE_COLOR: Record<ChatMode, string> = {
  strategic: "#4EF2C5",
  combat: "#FF6FD8",
  guardian: "#FFB020",
};

const ROLE_COLOR: Record<MsgRole, string> = {
  operator: "#00f0ff",
  nexusmon: "#a78bfa",
  system: "#475569",
  error: "#f87171",
};

export function CompanionChat() {
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

    const next: ChatMsg[] = [...history, { role: "operator", text: prompt }];
    setHistory(next);
    setLoading(true);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch("/v1/companion/nexusmon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
      });
      const resp = await res.json();
      if (resp.error) {
        setHistory([...next, { role: "error", text: `[ERROR] ${resp.error}` }]);
      } else {
        setHistory([...next, { role: "nexusmon", text: resp.reply, tier: resp.tier_used }]);
      }
    } catch (err: any) {
      setHistory([...next, { role: "error", text: `[ERROR] ${err?.message ?? "Request failed"}` }]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [input, loading, history, mode, scrollToBottom]);

  const modeColor = MODE_COLOR[mode];

  return (
    <div class="panel panel-chat" style={{ display: "flex", flexDirection: "column" }}>
      {/* Mode bar */}
      <div class="panel-header">
        <span style={{ color: "#a78bfa" }}>COMPANION</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(["strategic", "combat", "guardian"] as ChatMode[]).map((m) => (
            <button
              key={m}
              class="mode-btn"
              style={{
                color: mode === m ? MODE_COLOR[m] : "#475569",
                borderColor: mode === m ? MODE_COLOR[m] : "#1a1a2e",
                background: mode === m ? `${MODE_COLOR[m]}18` : "transparent",
              }}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
          {loading && <span style={{ color: "#475569", fontSize: 10, fontStyle: "italic" }}>▸ thinking…</span>}
        </div>
      </div>

      {/* Message history */}
      <div ref={scrollRef} class="chat-history">
        {history.map((msg, i) => (
          <div key={i} class="chat-row">
            {msg.role === "operator" && (
              <>
                <span style={{ color: ROLE_COLOR.operator, fontWeight: 700, marginRight: 8, whiteSpace: "nowrap" }}>operator&gt;</span>
                <span style={{ color: "#e2e8f0" }}>{msg.text}</span>
              </>
            )}
            {msg.role === "nexusmon" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: modeColor, fontWeight: 700, fontSize: 10, letterSpacing: 2 }}>NEXUSMON</span>
                  {msg.tier && (
                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, border: `1px solid ${modeColor}`, borderRadius: 3, padding: "1px 5px", color: modeColor }}>
                      {msg.tier}
                    </span>
                  )}
                </div>
                <span style={{ color: ROLE_COLOR.nexusmon, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.text}</span>
              </div>
            )}
            {msg.role === "system" && <span style={{ color: ROLE_COLOR.system, fontStyle: "italic" }}>{msg.text}</span>}
            {msg.role === "error" && <span style={{ color: ROLE_COLOR.error }}>{msg.text}</span>}
          </div>
        ))}
      </div>

      {/* Input */}
      <div class="chat-input-row">
        <span style={{ color: modeColor, fontWeight: 700, fontSize: 12, marginRight: 8, whiteSpace: "nowrap" }}>{mode}&gt;</span>
        <input
          class="chat-input"
          type="text"
          value={input}
          placeholder="speak to NEXUSMON…"
          disabled={loading}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
        />
        <button
          class="chat-send"
          style={{ borderColor: modeColor, color: modeColor, opacity: loading ? 0.4 : 1 }}
          onClick={() => void send()}
          disabled={loading}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
