import { type CSSProperties, useState } from "react";
import { spacing } from "../theme/cosmicTokens";
import { NexusmonBridgeHealth } from "../components/NexusmonBridgeHealth";
import { NexusmonBridgeOutput } from "../components/NexusmonBridgeOutput";
import {
  NexusmonModeSelector,
  type NexusmonMode,
} from "../components/NexusmonModeSelector";
import { NexusmonEntityPanel } from "../components/NexusmonEntityPanel";
import { EvolutionPanel } from "../components/EvolutionPanel";
import { SwarmPanel } from "../components/SwarmPanel";
import { FederationPanel } from "../components/FederationPanel";

export function NexusmonPage() {
  const [mode, setMode] = useState<NexusmonMode>("strategic");

  return (
    <section style={styles.wrapper}>
      <div style={styles.layout}>
        <div style={styles.column}>
          <NexusmonEntityPanel />
          <NexusmonBridgeOutput />
        </div>
        <div style={styles.column}>
          <NexusmonModeSelector value={mode} onChange={setMode} />
          <NexusmonBridgeHealth />
          <EvolutionPanel />
        </div>
      </div>
      <div style={styles.bottomRow}>
        <SwarmPanel />
        <FederationPanel />
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: spacing.lg,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: spacing.lg,
    alignItems: "start",
  },
  bottomRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: spacing.lg,
    alignItems: "start",
  },
  column: {
    display: "grid",
    gap: spacing.lg,
  },
};
