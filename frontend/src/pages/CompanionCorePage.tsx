import { CompanionCoreCard } from "../components/CompanionCoreCard";
import {
  clearCompanionComposer,
  useCompanionComposerState,
  useCompanionCore,
} from "../hooks/useCompanionCore";

export function CompanionCorePage() {
  const { status, messageResult, loading, error, refresh, message } =
    useCompanionCore();
  const composerState = useCompanionComposerState();

  return (
    <CompanionCoreCard
      status={status}
      messageResult={messageResult}
      loading={loading}
      error={error}
      onRefresh={refresh}
      onMessage={(text) => {
        void message(text);
        clearCompanionComposer();
      }}
      armedIntent={composerState.intent}
      armedDraft={composerState.draft}
      composerNonce={composerState.nonce}
      onClearArmedIntent={clearCompanionComposer}
    />
  );
}
