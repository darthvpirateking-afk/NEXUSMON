import { type CSSProperties, useState } from "react";
import { colors, radii, shadows, spacing, typography } from "../theme/cosmicTokens";
import { useZeroPoint } from "../hooks/useZeroPoint";

const SUBSYSTEMS = ["bridge", "cost", "combat", "seal"];

export function ZeroPointPanel() {
  const { overrides, totalActive, loading, error, applyOverride, expireOverride } =
    useZeroPoint();

  const [subsystem, setSubsystem] = useState("bridge");
  const [parameter, setParameter] = useState("");
  const [value, setValue] = useState("");
  const [opKey, setOpKey] = useState("");
  const [docHash, setDocHash] = useState("");
  const [ttl, setTtl] = useState("3600");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApply = async () => {
    setActionError(null);
    const parsedValue: unknown = (() => {
      const n = Number(value);
      return isNaN(n) ? value : n;
    })();
    const data = await applyOverride(subsystem, parameter, parsedValue, opKey, docHash, Number(ttl));
    if (data?.error) setActionError(String(data.error));
  };

  const activeList = overrides.filter((o) => o.active);
  const expiredList = overrides.filter((o) => !o.active);

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>ZERO-POINT OVERRIDE</span>
        <span style={{ ...styles.badge, borderColor: `${colors.secondaryAccent}66`, color: colors.secondaryAccent }}>
          {totalActive} ACTIVE
        </span>
        {loading && <span style={styles.dim}>…</span>}
      </div>

      {/* Apply override */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>APPLY OVERRIDE — SOVEREIGN SEAL REQUIRED</span>
        <div style={styles.inputGrid}>
          <select style={styles.select} value={subsystem} onChange={(e) => setSubsystem(e.target.value)}>
            {SUBSYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input style={styles.input} placeholder="parameter" value={parameter} onChange={(e) => setParameter(e.target.value)} />
          <input style={styles.input} placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} />
          <input style={{ ...styles.input, width: 70 }} placeholder="TTL s" type="number" value={ttl} onChange={(e) => setTtl(e.target.value)} />
        </div>
        <div style={styles.inputGrid}>
          <input style={{ ...styles.input, flex: 1 }} placeholder="Operator key" type="password" value={opKey} onChange={(e) => setOpKey(e.target.value)} />
          <input style={{ ...styles.input, flex: 2 }} placeholder="Doctrine hash (sha256)" value={docHash} onChange={(e) => setDocHash(e.target.value)} />
          <button
            style={{ ...styles.btn, opacity: (!opKey || !parameter) ? 0.5 : 1, cursor: (!opKey || !parameter) ? "not-allowed" : "pointer" }}
            onClick={() => void handleApply()}
            disabled={!opKey || !parameter}
          >
            OVERRIDE
          </button>
        </div>
        {actionError && <p style={styles.err}>{actionError}</p>}
      </div>

      {/* Active overrides */}
      {activeList.length > 0 && (
        <div style={styles.section}>
          <span style={styles.sectionLabel}>ACTIVE ({activeList.length})</span>
          <div style={styles.list}>
            {activeList.map((o) => (
              <div key={o.override_id} style={styles.row}>
                <span style={{ ...styles.subsystemTag, borderColor: `${colors.secondaryAccent}44` }}>
                  {o.subsystem}
                </span>
                <span style={styles.param}>{o.parameter}</span>
                <span style={styles.val}>{String(o.value)}</span>
                <span style={styles.dim}>{o.ttl_seconds}s</span>
                <button
                  style={styles.expireBtn}
                  onClick={() => void expireOverride(o.override_id)}
                >
                  EXPIRE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired count */}
      {expiredList.length > 0 && (
        <p style={{ ...styles.dim, fontSize: "0.62rem" }}>
          {expiredList.length} expired override{expiredList.length !== 1 ? "s" : ""} in history
        </p>
      )}

      {error && <p style={styles.err}>{error}</p>}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: colors.cardBg,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    display: "grid",
    gap: spacing.md,
    boxShadow: shadows.card,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLg,
    letterSpacing: "0.08em",
    flex: 1,
  },
  badge: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    border: "1px solid",
    borderRadius: radii.md,
    padding: `2px ${spacing.sm}`,
  },
  dim: { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.fontSizeSm },
  section: { display: "grid", gap: spacing.sm },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: "0.62rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.1em",
  },
  inputGrid: { display: "flex", gap: spacing.sm, flexWrap: "wrap", alignItems: "center" },
  input: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    outline: "none",
    flex: 1,
    minWidth: 80,
  },
  select: {
    background: "#0a0f1e",
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radii.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: "pointer",
  },
  btn: {
    background: "transparent",
    border: `1px solid ${colors.secondaryAccent}`,
    borderRadius: radii.md,
    color: colors.secondaryAccent,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeSm,
    letterSpacing: "0.08em",
    padding: `${spacing.sm} ${spacing.lg}`,
    whiteSpace: "nowrap",
  },
  err: { margin: 0, color: colors.error, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamily },
  list: { display: "grid", gap: "4px" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: "#0a0f1e",
    borderRadius: radii.sm,
    border: `1px solid ${colors.borderColor}`,
  },
  subsystemTag: {
    fontSize: "0.62rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.08em",
    color: colors.secondaryAccent,
    border: "1px solid",
    borderRadius: radii.sm,
    padding: `1px ${spacing.xs}`,
    whiteSpace: "nowrap",
  },
  param: { color: colors.textSecondary, fontSize: typography.fontSizeSm, fontFamily: "monospace", flex: 1 },
  val: { color: colors.textPrimary, fontSize: typography.fontSizeSm, fontFamily: "monospace", fontWeight: typography.fontWeightBold },
  expireBtn: {
    background: "transparent",
    border: `1px solid ${colors.warning}66`,
    borderRadius: radii.sm,
    color: colors.warning,
    cursor: "pointer",
    fontSize: "0.6rem",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightBold,
    letterSpacing: "0.06em",
    padding: `1px ${spacing.sm}`,
  },
};
