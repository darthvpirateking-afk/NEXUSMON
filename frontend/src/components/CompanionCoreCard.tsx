import { useEffect, useState, type CSSProperties } from "react";
import type {
  CompanionCoreMessageResponse,
  CompanionCoreStatus,
} from "../types/companionCore";
import type { CompanionComposerIntent } from "../hooks/useCompanionCore";

interface CompanionCoreCardProps {
  status: CompanionCoreStatus | null;
  messageResult: CompanionCoreMessageResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMessage: (text: string) => void;
  armedIntent: CompanionComposerIntent;
  armedDraft: string;
  composerNonce: number;
  onClearArmedIntent: () => void;
}

export function CompanionCoreCard({
  status,
  messageResult,
  loading,
  error,
  onRefresh,
  onMessage,
  armedIntent,
  armedDraft,
  composerNonce,
  onClearArmedIntent,
}: CompanionCoreCardProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (armedDraft) {
      setText(armedDraft);
    }
  }, [armedDraft, composerNonce]);

  return (
    <section style={styles.card}>
      <header style={styles.header}>
        <h2 style={styles.title}>Companion Core</h2>
        <button
          style={styles.button}
          onClick={onRefresh}
          disabled={loading}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {status ? (
        <p style={styles.meta}>
          Source: {status.source} · memory: v{status.memory_version} · outcomes:{" "}
          {status.outcomes_count}
        </p>
      ) : null}

      {status?.summary ? (
        <p style={styles.meta}>Summary: {status.summary}</p>
      ) : null}

      {armedIntent ? (
        <div style={styles.intentBar}>
          <span style={styles.intentBadge}>{armedIntent.toUpperCase()} ARMED</span>
          <span style={styles.intentCopy}>
            Draft staged from the active cockpit. Review, edit, then send through the real companion route.
          </span>
          <button type="button" style={styles.dismissButton} onClick={onClearArmedIntent}>
            Clear
          </button>
        </div>
      ) : null}

      <div style={styles.row}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Message companion core"
          style={styles.input}
        />
        <button
          type="button"
          style={styles.button}
          disabled={loading || text.trim().length === 0}
          onClick={() => {
            onMessage(text);
            setText("");
          }}
        >
          {armedIntent === "seal" ? "Seal + Send" : armedIntent === "transmit" ? "Transmit" : "Send"}
        </button>
      </div>

      {messageResult ? (
        <p style={messageResult.ok ? styles.ok : styles.error}>
          {messageResult.reply}
        </p>
      ) : null}

      {error ? <p style={styles.error}>{error}</p> : null}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    border: "1px solid #2e3b4a",
    borderRadius: "12px",
    padding: "12px",
    background: "#131b24",
    display: "grid",
    gap: "8px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "1rem",
  },
  row: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 180px",
    borderRadius: "8px",
    border: "1px solid #3a4f64",
    background: "#111922",
    color: "#e9edf3",
    padding: "10px",
    minHeight: "44px",
    font: "inherit",
  },
  button: {
    border: "1px solid #3d6e9e",
    background: "#24527a",
    color: "#f3f8ff",
    borderRadius: "8px",
    padding: "10px 14px",
    minHeight: "44px",
    cursor: "pointer",
    font: "inherit",
    flexShrink: 0,
  },
  meta: {
    margin: 0,
    color: "#b2c1d1",
  },
  intentBar: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: "8px",
    alignItems: "center",
    border: "1px solid #4b6175",
    borderRadius: "10px",
    padding: "10px 12px",
    background: "rgba(36,82,122,0.18)",
  },
  intentBadge: {
    color: "#f3d173",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
  },
  intentCopy: {
    color: "#d1dfed",
    fontSize: "0.9rem",
    lineHeight: 1.4,
  },
  dismissButton: {
    border: "1px solid #53697c",
    background: "transparent",
    color: "#d1dfed",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    font: "inherit",
  },
  ok: {
    margin: 0,
    color: "#9df5bf",
  },
  error: {
    margin: 0,
    color: "#ff9b9b",
  },
};
