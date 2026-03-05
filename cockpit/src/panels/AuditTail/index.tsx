import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../../api/client";

const EVENT_COLOR: Record<string, string> = {
  governance: "#9b59b6",
  status_change: "#3498db",
  worker_assigned: "#1abc9c",
  artifact_sealed: "#00ff88",
  xp_awarded: "#f1c40f",
  rank_up: "#e67e22",
  failure: "#e74c3c",
  timeout: "#e74c3c",
  quarantine: "#ff6b35",
};

export function AuditTail() {
  const [entries, setEntries] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = api.audit.stream();
    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data);
        setEntries((prev) => [...prev, entry].slice(-200));
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch {
        // ignore invalid chunks
      }
    };
    return () => source.close();
  }, []);

  return (
    <div class="panel panel-tall">
      <div class="panel-header">
        <span style={{ color: "#9b59b6" }}>SHADOW CHANNEL</span>
        <span style={{ color: live ? "#00ff88" : "#e74c3c", fontSize: 10 }}>
          {live ? "LIVE" : "OFFLINE"}
        </span>
      </div>
      <div class="scroll-area">
        {entries.length === 0 && <div class="muted">Awaiting events...</div>}
        {entries.map((entry, idx) => (
          <div key={`${entry.timestamp}-${idx}`} class="audit-row">
            <span class="ts">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span style={{ color: EVENT_COLOR[entry.event_type] ?? "#888" }}>
              {entry.event_type}
            </span>
            <span class="mission-id">{entry.mission_id?.slice(0, 8)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
