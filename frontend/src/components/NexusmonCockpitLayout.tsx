import { useState, type CSSProperties } from "react";
import { armCompanionComposer } from "../hooks/useCompanionCore";
import { NexusmonModeSelector, type NexusmonMode } from "../components/NexusmonModeSelector";
import { NexusmonBridgeHealth } from "../components/NexusmonBridgeHealth";
import { NexusmonBridgeOutput } from "../components/NexusmonBridgeOutput";
import { ArtifactVaultPanel } from "../components/ArtifactVaultPanel";
import { EvolutionPanel } from "../components/EvolutionPanel";
import { NexusmonMissionCommandCard } from "../components/NexusmonMissionCommandCard";
import { NexusmonPresencePanel } from "../components/NexusmonPresencePanel";
import { OperatorMemoryPanel } from "../components/OperatorMemoryPanel";
import { DeploymentReadinessPanel } from "../components/DeploymentReadinessPanel";
import { SupplyNetworkPanel } from "../components/SupplyNetworkPanel";
import { TelemetrySummaryPanel } from "../components/TelemetrySummaryPanel";
import { colors, radii, spacing, shadows } from "../theme/cosmicTokens";

function SectionLabel({ children }: { children: string }) {
  return <span style={label}>{children}</span>;
}

const label: CSSProperties = {
  color: colors.textSecondary,
  fontSize: "0.55rem",
  fontFamily: "monospace",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
};

const panel: CSSProperties = {
  background: "linear-gradient(135deg, #060e14 0%, #070c15 100%)",
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radii.md,
  padding: spacing.md,
  display: "flex",
  flexDirection: "column",
  gap: spacing.sm,
  overflow: "hidden",
  minHeight: 0,
  position: "relative",
  boxShadow: shadows.card,
};

const modePanel: CSSProperties = {
  ...panel,
  gap: spacing.md,
};

const modeHint: CSSProperties = {
  margin: 0,
  color: colors.textSecondary,
  fontSize: "0.72rem",
  fontFamily: "monospace",
  lineHeight: 1.5,
};

const actionRail: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: spacing.sm,
};

const actionButton: CSSProperties = {
  minHeight: 42,
  borderRadius: radii.md,
  border: "1px solid",
  background: "transparent",
  cursor: "pointer",
  fontFamily: "monospace",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
};

const sealButton: CSSProperties = {
  color: "#f0c24c",
  borderColor: "rgba(240,194,76,0.55)",
  boxShadow: "0 0 14px rgba(240,194,76,0.18)",
};

const transmitButton: CSSProperties = {
  color: colors.primaryAccent,
  borderColor: `${colors.primaryAccent}66`,
  boxShadow: `0 0 14px ${colors.primaryAccent}22`,
};

const actionHint: CSSProperties = {
  margin: 0,
  color: colors.textSecondary,
  fontSize: "0.72rem",
  fontFamily: "monospace",
  lineHeight: 1.5,
};

const railStack: CSSProperties = {
  display: "grid",
  gap: spacing.md,
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  paddingRight: 2,
};

export function NexusmonCockpitLayout({ onOpenCompanion }: { onOpenCompanion: () => void }) {
  const [mode, setMode] = useState<NexusmonMode>("strategic");

  const handleCompanionAction = (intent: "seal" | "transmit") => {
    armCompanionComposer(intent);
    onOpenCompanion();
  };

  return (
    <div style={root}>
      <div style={backdropGlow} />
      <div style={backdropGrid} />

      <NexusmonPresencePanel />

      <div style={body}>
        <div style={leftCol}>
          <div style={{ ...panel, minHeight: 0 }}>
            <OperatorMemoryPanel />
          </div>

          <div style={modePanel}>
            <SectionLabel>OPERATOR MODE</SectionLabel>
            <p style={modeHint}>
              This selector now affects new mission launches. Guardian remains a governed monitor state and the backend blocks outbound bridge calls there.
            </p>
            <NexusmonModeSelector value={mode} onChange={setMode} />
            <div style={actionRail}>
              <button
                type="button"
                style={{ ...actionButton, ...sealButton }}
                onClick={() => handleCompanionAction("seal")}
              >
                SEAL
              </button>
              <button
                type="button"
                style={{ ...actionButton, ...transmitButton }}
                onClick={() => handleCompanionAction("transmit")}
              >
                TRANSMIT
              </button>
            </div>
            <p style={actionHint}>
              SEAL and TRANSMIT now arm the real Companion composer instead of sitting as dead cockpit ornament.
            </p>
          </div>

          <div style={railStack}>
            <div style={{ ...panel, flexShrink: 0 }}>
              <DeploymentReadinessPanel />
            </div>

            <div style={{ ...panel, flexShrink: 0 }}>
              <SupplyNetworkPanel />
            </div>
          </div>
        </div>

        <div style={centerCol}>
          <div style={bridgeShell}>
            <NexusmonBridgeOutput />
          </div>
          <div style={{ ...panel, flexShrink: 0 }}>
            <NexusmonBridgeHealth />
          </div>
          <div style={{ ...panel, flexShrink: 0 }}>
            <TelemetrySummaryPanel />
          </div>
        </div>

        <div style={rightCol}>
          <div style={{ ...panel, flexShrink: 0 }}>
            <EvolutionPanel />
          </div>

          <div style={{ ...panel, flexShrink: 0, maxHeight: 360 }}>
            <ArtifactVaultPanel />
          </div>

          <div style={{ ...panel, flex: 1, minHeight: 0 }}>
            <NexusmonMissionCommandCard mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}

const root: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: spacing.sm,
  height: "100%",
  overflow: "hidden",
  padding: spacing.md,
  boxSizing: "border-box",
  minHeight: 0,
  background: "linear-gradient(180deg, #02060c 0%, #040814 48%, #050711 100%)",
};

const backdropGlow: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 18% 10%, rgba(0,255,204,0.08), transparent 24%), radial-gradient(circle at 78% 18%, rgba(232,213,163,0.08), transparent 20%), radial-gradient(circle at 50% 85%, rgba(105,240,255,0.08), transparent 28%)",
  pointerEvents: "none",
};

const backdropGrid: CSSProperties = {
  position: "absolute",
  inset: spacing.md,
  borderRadius: radii.lg,
  backgroundImage:
    "linear-gradient(rgba(78,242,197,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(78,242,197,0.03) 1px, transparent 1px)",
  backgroundSize: "64px 64px",
  maskImage: "linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,1) 24%, rgba(0,0,0,1) 76%, rgba(0,0,0,0.22))",
  pointerEvents: "none",
};

const body: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1.1fr) 420px",
  gap: spacing.md,
  flex: 1,
  overflow: "hidden",
  minHeight: 0,
  position: "relative",
  zIndex: 1,
};

const col: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.md,
  overflow: "hidden",
  minHeight: 0,
};

const leftCol: CSSProperties = {
  ...col,
};

const centerCol: CSSProperties = {
  ...col,
};

const rightCol: CSSProperties = {
  ...col,
};

const bridgeShell: CSSProperties = {
  ...panel,
  flex: 1,
  minHeight: 0,
  background:
    "linear-gradient(180deg, rgba(4,10,18,0.98) 0%, rgba(5,9,16,0.96) 100%), radial-gradient(circle at top, rgba(0,255,204,0.06), transparent 32%)",
  boxShadow: "0 0 48px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.03)",
};