import { useEffect, useState } from "preact/hooks";
import { api } from "../../api/client";

const RANK_COLOR: Record<string, string> = {
  DORMANT: "#444",
  AWAKENING: "#9b59b6",
  ACTIVE: "#3498db",
  SOVEREIGN: "#f1c40f",
  ASCENDANT: "#00ff88",
};

export function AvatarPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(await api.avatar.xp());
      } catch {
        // keep previous state
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 10_000);
    return () => clearInterval(timer);
  }, []);

  const summary = data?.summary ?? data ?? {};
  const rank = summary?.rank ?? data?.rank ?? "DORMANT";
  const xp = summary?.xp ?? data?.xp ?? 0;
  const toNext = summary?.xp_to_next_rank;
  const pct = summary?.progress_pct ?? 0;
  const caps = summary?.capabilities ?? {};
  const missionsComplete = summary?.missions_complete ?? data?.missions_complete ?? 0;

  return (
    <div class="panel">
      <div class="panel-header">
        <span style={{ color: "#f1c40f" }}>AVATAR</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          style={{
            color: RANK_COLOR[rank],
            fontSize: 18,
            fontWeight: "bold",
            letterSpacing: 4,
          }}
        >
          {rank}
        </div>
        <div class="muted" style={{ marginTop: 4 }}>
          {xp.toLocaleString()} XP
          {toNext && ` | ${toNext.toLocaleString()} to next`}
        </div>
      </div>

      <div class="xp-bar-bg">
        <div
          class="xp-bar-fill"
          style={{
            width: `${Math.min(100, pct * 100).toFixed(1)}%`,
            background: RANK_COLOR[rank],
          }}
        />
      </div>

      <div class="cap-list">
        {Object.entries(caps).map(([cap, enabled]: any) => (
          <div key={cap} class="cap-row">
            <span class="muted">{cap.replace(/_/g, " ")}</span>
            <span style={{ color: enabled ? "#00ff88" : "#333" }}>
              {enabled ? "Y" : "N"}
            </span>
          </div>
        ))}
      </div>

      <div class="muted" style={{ textAlign: "center", marginTop: 8 }}>
        {missionsComplete} missions complete
        {summary?.evolution_pending && (
          <span style={{ color: "#f1c40f" }}> | evolution pending</span>
        )}
      </div>
    </div>
  );
}
