import { useCallback, useState } from "react";
import {
  mergeFlowCanvasPreferences,
  readStoredFlowCanvasPreferences,
  writeStoredFlowCanvasPreferences,
  type FlowCanvasPreferences,
} from "./flow-canvas-ui-persistence";

export function useFlowCanvasPreferences(): {
  preferences: FlowCanvasPreferences;
  patchPreferences: (patch: Partial<FlowCanvasPreferences>) => void;
} {
  const [preferences, setPreferences] = useState<FlowCanvasPreferences>(() =>
    readStoredFlowCanvasPreferences(),
  );

  const patchPreferences = useCallback((patch: Partial<FlowCanvasPreferences>) => {
    setPreferences((prev) => {
      const next = mergeFlowCanvasPreferences(prev, patch);
      writeStoredFlowCanvasPreferences(next);
      return next;
    });
  }, []);

  return { preferences, patchPreferences };
}
