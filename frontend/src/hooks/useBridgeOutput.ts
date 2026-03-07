import { useEffect, useState } from "react";

export interface BridgeOutputState {
  output: string | null;
  mode: string | null;
  backendBacked: boolean;
}

type Listener = (state: BridgeOutputState) => void;

let latestState: BridgeOutputState = {
  output: null,
  mode: null,
  backendBacked: false,
};
const listeners = new Set<Listener>();

export function setBridgeOutput(
  output: string | null,
  mode: string | null,
  options?: { backendBacked?: boolean },
): void {
  latestState = {
    output,
    mode,
    backendBacked: Boolean(output && options?.backendBacked),
  };
  for (const listener of listeners) {
    listener(latestState);
  }
}

export function useBridgeOutput(): BridgeOutputState {
  const [state, setState] = useState<BridgeOutputState>(latestState);

  useEffect(() => {
    const listener: Listener = (nextState) => setState(nextState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}
