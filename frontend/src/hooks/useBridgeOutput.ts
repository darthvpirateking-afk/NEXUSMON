import { useEffect, useState } from "react";

type Listener = (output: string | null, mode: string | null) => void;

let latestOutput: string | null = null;
let latestMode: string | null = null;
const listeners = new Set<Listener>();

export function setBridgeOutput(output: string | null, mode: string | null): void {
  latestOutput = output;
  latestMode = mode;
  for (const listener of listeners) {
    listener(output, mode);
  }
}

export function useBridgeOutput(): { output: string | null; mode: string | null } {
  const [output, setOutput] = useState<string | null>(latestOutput);
  const [mode, setMode] = useState<string | null>(latestMode);

  useEffect(() => {
    const listener: Listener = (nextOutput, nextMode) => {
      setOutput(nextOutput);
      setMode(nextMode);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { output, mode };
}
