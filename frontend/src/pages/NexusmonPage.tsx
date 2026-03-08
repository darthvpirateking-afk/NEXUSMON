import { NexusmonCockpitLayout } from "../components/NexusmonCockpitLayout";

export function NexusmonPage({ onOpenCompanion }: { onOpenCompanion: () => void }) {
  return <NexusmonCockpitLayout onOpenCompanion={onOpenCompanion} />;
}
