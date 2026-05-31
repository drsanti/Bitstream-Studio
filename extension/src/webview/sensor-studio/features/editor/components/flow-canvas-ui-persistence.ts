/** localStorage persistence for {@link FlowCanvasPreferences}. */

import {
  coerceFlowCanvasPreferences,
  DEFAULT_FLOW_CANVAS_PREFERENCES,
  mergeFlowCanvasPreferences,
  type FlowCanvasPreferences,
} from "../../../persistence/flow-canvas-preferences";

export type {
  FlowCanvasEdgeRoutingStyle,
  FlowCanvasGridSize,
  FlowCanvasPreferences,
} from "../../../persistence/flow-canvas-preferences";

export {
  DEFAULT_FLOW_CANVAS_PREFERENCES,
  FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW,
  coerceFlowCanvasPreferences,
  mergeFlowCanvasPreferences,
} from "../../../persistence/flow-canvas-preferences";

const STORAGE_KEY = "ternion.sensor-studio.flowCanvas.prefs.v1";

function safeGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* quota / private mode */
  }
}

export function readStoredFlowCanvasPreferences(): FlowCanvasPreferences {
  const raw = safeGet();
  if (raw == null || raw.length === 0) {
    return { ...DEFAULT_FLOW_CANVAS_PREFERENCES };
  }
  try {
    return coerceFlowCanvasPreferences(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_FLOW_CANVAS_PREFERENCES };
  }
}

export function writeStoredFlowCanvasPreferences(next: FlowCanvasPreferences): void {
  safeSet(JSON.stringify(next));
}
