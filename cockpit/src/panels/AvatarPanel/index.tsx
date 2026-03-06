import { useEffect, useState } from "preact/hooks";
import { api } from "../../api/client";

const RANK_COLOR: Record<string, string> = {
  DORMANT:   "#444444",
  AWAKENING: "#9b59b6",
  ACTIVE:    "#00f0ff",
  SOVEREIGN: "#f1c40f",
  ASCENDANT: "#00ff88",
};

function NexusMechAvatar({ coreColor }: { coreColor: string }) {
  return (
    <svg viewBox="0 0 120 185" width="140" height="185"
      style={{ display: "block", margin: "0 auto 12px", overflow: "visible" }}>
      <defs>
        <filter id="nxglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nxcoreglow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* HEAD */}
      <rect x="42" y="6" width="36" height="26" rx="3" fill="#0d0d1a" stroke="#1e1e3a" strokeWidth="1.5"/>
      <line x1="42" y1="11" x2="78" y2="11" stroke="#111128" strokeWidth="0.75"/>
      <line x1="42" y1="27" x2="78" y2="27" stroke="#111128" strokeWidth="0.75"/>
      {/* Visor */}
      <rect x="45" y="14" width="30" height="10" rx="2" fill={coreColor} opacity="0.75" filter="url(#nxglow)"/>
      <rect x="45" y="14" width="30" height="10" rx="2" fill="none" stroke={coreColor} strokeWidth="0.5"/>
      {/* Antenna */}
      <line x1="50" y1="6" x2="47" y2="1" stroke="#1e1e3a" strokeWidth="1.5"/>
      <circle cx="47" cy="1" r="1.5" fill={coreColor} opacity="0.8" class="avatar-blink"/>
      <line x1="70" y1="6" x2="73" y2="1" stroke="#1e1e3a" strokeWidth="1.5"/>
      <circle cx="73" cy="1" r="1.5" fill={coreColor} opacity="0.8" class="avatar-blink"/>

      {/* NECK */}
      <rect x="53" y="32" width="14" height="6" fill="#0a0a15" stroke="#1a1a2e" strokeWidth="1"/>

      {/* SHOULDERS */}
      <polygon points="14,46 38,40 38,62 14,66" fill="#0d0d1a" stroke="#1e1e3a" strokeWidth="1.5"/>
      <line x1="14" y1="56" x2="38" y2="51" stroke={coreColor} strokeWidth="0.5" opacity="0.3"/>
      <polygon points="106,46 82,40 82,62 106,66" fill="#0d0d1a" stroke="#1e1e3a" strokeWidth="1.5"/>
      <line x1="106" y1="56" x2="82" y2="51" stroke={coreColor} strokeWidth="0.5" opacity="0.3"/>

      {/* TORSO */}
      <rect x="38" y="39" width="44" height="56" rx="4" fill="#08081a" stroke="#1e1e3a" strokeWidth="1.5"/>
      <line x1="42" y1="46" x2="78" y2="46" stroke="#111128" strokeWidth="0.75"/>
      <line x1="42" y1="88" x2="78" y2="88" stroke="#111128" strokeWidth="0.75"/>
      {/* Circuit traces */}
      <path d="M42,58 H52" stroke={coreColor} strokeWidth="0.5" opacity="0.35"/>
      <path d="M68,58 H78" stroke={coreColor} strokeWidth="0.5" opacity="0.35"/>
      <path d="M42,74 H52" stroke={coreColor} strokeWidth="0.5" opacity="0.35"/>
      <path d="M68,74 H78" stroke={coreColor} strokeWidth="0.5" opacity="0.35"/>
      <path d="M52,46 V54 H56" stroke={coreColor} strokeWidth="0.5" opacity="0.25"/>
      <path d="M68,46 V54 H64" stroke={coreColor} strokeWidth="0.5" opacity="0.25"/>

      {/* ENERGY CORE */}
      <circle cx="60" cy="64" r="17" fill="none" stroke={coreColor} strokeWidth="0.4" opacity="0.15"/>
      <circle cx="60" cy="64" r="13" fill="none" stroke={coreColor} strokeWidth="0.8" opacity="0.4"/>
      <circle cx="60" cy="64" r="9"  fill={coreColor} opacity="0.08"/>
      <circle cx="60" cy="64" r="9"  fill="none" stroke={coreColor} strokeWidth="1.5" opacity="0.75"/>
      <circle cx="60" cy="64" r="5"  fill={coreColor} opacity="0.95"
        filter="url(#nxcoreglow)" class="avatar-core"/>

      {/* ARMS — left */}
      <rect x="15" y="52" width="21" height="30" rx="3" fill="#0a0a15" stroke="#1a1a2e" strokeWidth="1.5"/>
      <line x1="18" y1="59" x2="33" y2="59" stroke="#111128" strokeWidth="0.75"/>
      <rect x="14" y="84" width="23" height="26" rx="3" fill="#08081a" stroke="#1a1a2e" strokeWidth="1"/>
      <rect x="13" y="100" width="25" height="3" rx="1" fill={coreColor} opacity="0.2"/>
      <line x1="13" y1="101" x2="38" y2="101" stroke={coreColor} strokeWidth="0.5" opacity="0.5"/>
      <rect x="13" y="111" width="25" height="12" rx="2" fill="#0d0d1a" stroke="#1a1a2e" strokeWidth="1"/>

      {/* ARMS — right */}
      <rect x="84" y="52" width="21" height="30" rx="3" fill="#0a0a15" stroke="#1a1a2e" strokeWidth="1.5"/>
      <line x1="87" y1="59" x2="102" y2="59" stroke="#111128" strokeWidth="0.75"/>
      <rect x="83" y="84" width="23" height="26" rx="3" fill="#08081a" stroke="#1a1a2e" strokeWidth="1"/>
      <rect x="82" y="100" width="25" height="3" rx="1" fill={coreColor} opacity="0.2"/>
      <line x1="82" y1="101" x2="107" y2="101" stroke={coreColor} strokeWidth="0.5" opacity="0.5"/>
      <rect x="82" y="111" width="25" height="12" rx="2" fill="#0d0d1a" stroke="#1a1a2e" strokeWidth="1"/>

      {/* WAIST */}
      <rect x="40" y="96" width="40" height="10" rx="2" fill="#0a0a15" stroke="#1e1e3a" strokeWidth="1"/>
      <rect x="54" y="97" width="12" height="8" rx="1" fill={coreColor} opacity="0.18"/>

      {/* LEGS — left */}
      <rect x="40" y="108" width="20" height="30" rx="3" fill="#0a0a15" stroke="#1a1a2e" strokeWidth="1.5"/>
      <rect x="38" y="130" width="24" height="7" rx="2" fill="#0d0d1a" stroke={coreColor} strokeWidth="0.75" opacity="0.65"/>
      <rect x="40" y="139" width="20" height="28" rx="3" fill="#08081a" stroke="#1a1a2e" strokeWidth="1"/>
      <rect x="37" y="165" width="26" height="10" rx="2" fill="#0d0d1a" stroke="#1e1e3a" strokeWidth="1"/>
      <line x1="37" y1="169" x2="63" y2="169" stroke={coreColor} strokeWidth="0.5" opacity="0.35"/>

      {/* LEGS — right */}
      <rect x="60" y="108" width="20" height="30" rx="3" fill="#0a0a15" stroke="#1a1a2e" strokeWidth="1.5"/>
      <rect x="58" y="130" width="24" height="7" rx="2" fill="#0d0d1a" stroke={coreColor} strokeWidth="0.75" opacity="0.65"/>
      <rect x="60" y="139" width="20" height="28" rx="3" fill="#08081a" stroke="#1a1a2e" strokeWidth="1"/>
      <rect x="57" y="165" width="26" height="10" rx="2" fill="#0d0d1a" stroke="#1e1e3a" strokeWidth="1"/>
      <line x1="57" y1="169" x2="83" y2="169" stroke={coreColor} strokeWidth="0.5" opacity="0.35"/>
    </svg>
  );
}

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

      <NexusMechAvatar coreColor={RANK_COLOR[rank] ?? "#444"} />

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
