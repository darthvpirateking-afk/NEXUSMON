import { useEffect, useState } from "preact/hooks";
import { api } from "../../api/client";

const COLOR: Record<string, string> = {
  ok: "#00ff88",
  degraded: "#ffaa00",
  error: "#ff4444",
};
const ICON: Record<string, string> = {
  ok: "OK",
  degraded: "WARN",
  error: "ERR",
};

export function HealthGrid() {
  const [health, setHealth] = useState<any>(null);
  const [ts, setTs] = useState<string>("");

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await api.health.deep();
        setHealth(data);
        setTs(new Date().toLocaleTimeString());
      } catch {
        setHealth(null);
      }
    };
    poll();
    const timer = setInterval(poll, 5_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div class="panel">
      <div class="panel-header">
        <span style={{ color: "#00ff88" }}>SYSTEM HEALTH</span>
        <span style={{ color: "#444", fontSize: 10 }}>
          {ts ? `last: ${ts}` : "connecting..."}
        </span>
      </div>
      {!health ? (
        <div class="muted">Connecting...</div>
      ) : (
        <div class="grid-2">
          {Object.entries(health.subsystems ?? {}).map(([name, status]: any) => (
            <div
              key={name}
              class="subsystem-row"
              style={{ borderColor: `${COLOR[status] ?? "#333"}33` }}
            >
              <span class="label">{name}</span>
              <span style={{ color: COLOR[status] ?? "#666" }}>
                {ICON[status] ?? "?"} {status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
