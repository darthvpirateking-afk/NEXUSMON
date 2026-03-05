import { useState } from "preact/hooks";
import { api } from "../../api/client";

const TYPES = [
  "analysis",
  "data_transform",
  "artifact_gen",
  "webhook_triggered",
  "scheduled",
];

const STATUS_COLOR: Record<string, string> = {
  pending: "#888",
  governance_check: "#9b59b6",
  running: "#3498db",
  complete: "#00ff88",
  failed: "#e74c3c",
  denied: "#e74c3c",
  quarantined: "#ff6b35",
  rolling_back: "#ffaa00",
};

export function MissionConsole() {
  const [type, setType] = useState("analysis");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.missions.dispatch(type, { prompt });
      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const status = result?.mission?.status;

  return (
    <div class="panel">
      <div class="panel-header">
        <span style={{ color: "#3498db" }}>MISSION CONSOLE</span>
      </div>

      <select
        value={type}
        onChange={(event: any) => setType(event.target.value)}
        class="input-select"
      >
        {TYPES.map((item) => (
          <option value={item}>{item}</option>
        ))}
      </select>

      <textarea
        value={prompt}
        onInput={(event: any) => setPrompt(event.target.value)}
        placeholder="Enter mission prompt..."
        rows={3}
        class="input-textarea"
      />

      <button
        onClick={dispatch}
        disabled={loading || !prompt.trim()}
        class="btn-dispatch"
        style={{
          background: loading ? "#1a1a1a" : "#00ff8814",
          color: loading ? "#444" : "#00ff88",
          borderColor: loading ? "#333" : "#00ff88",
        }}
      >
        {loading ? "DISPATCHING..." : "DISPATCH MISSION"}
      </button>

      {error && (
        <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 8 }}>ERROR: {error}</div>
      )}

      {result && (
        <div class="mission-result">
          <div
            style={{
              color: STATUS_COLOR[status] ?? "#888",
              fontWeight: "bold",
              marginBottom: 6,
            }}
          >
            {status?.toUpperCase()} - {result.mission?.id?.slice(0, 8)}
          </div>
          <div class="muted">Governance: {result.mission?.governance_result ?? "-"}</div>
          <div class="muted">Tokens: {result.mission?.tokens_used ?? 0}</div>
          {result.artifact_id && (
            <div style={{ color: "#00ff8888" }}>
              Artifact: {result.artifact_id?.slice(0, 8)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
