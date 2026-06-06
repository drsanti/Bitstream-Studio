import { isPlotterNodeId } from "../plotter/plotter-config";
import { isScene3dInspectorNodeId } from "../scene3d/scene3d-inspector-node-ids";
import type { StudioNodeData } from "../../store/flow-editor.store";

export type StudioNodeMinDimensions = {
  minWidth: number;
  minHeight: number;
};

/** Fallback when a node id has no catalog-specific floor. */
export const STUDIO_NODE_DEFAULT_MIN_DIMENSIONS: StudioNodeMinDimensions = {
  minWidth: 170,
  minHeight: 64,
};

/**
 * Minimum React Flow node size floors (before header/socket/body measurement).
 * Applied in `pipeStudioNodeData` for resizable studio nodes.
 */
const MIN_BY_NODE_ID: Readonly<Record<string, StudioNodeMinDimensions>> = {
  "scene-output": { minWidth: 185, minHeight: 72 },
  "model-select": { minWidth: 208, minHeight: 88 },
  environment: { minWidth: 240, minHeight: 220 },
  "camera-view": { minWidth: 240, minHeight: 220 },
  "model-viewer": { minWidth: 280, minHeight: 200 },
  "rotation-3d-euler": { minWidth: 280, minHeight: 200 },
  "rotation-3d-quaternion": { minWidth: 280, minHeight: 200 },
  plotter: { minWidth: 280, minHeight: 168 },
  "radial-gauge": { minWidth: 170, minHeight: 180 },
  "bar-meter": { minWidth: 170, minHeight: 180 },
  knob: { minWidth: 170, minHeight: 180 },
  "glb-animation-bundle": { minWidth: 220, minHeight: 160 },
  "mic-input": { minWidth: 200, minHeight: 110 },
  "audio-output": { minWidth: 200, minHeight: 110 },
  "audio-scope": { minWidth: 200, minHeight: 110 },
  "audio-file-player": { minWidth: 200, minHeight: 110 },
  "audio-oscillator": { minWidth: 200, minHeight: 110 },
  "glb-material-texture": { minWidth: 200, minHeight: 120 },
  "glb-material-color": { minWidth: 200, minHeight: 100 },
  "glb-material-param": { minWidth: 200, minHeight: 100 },
  math: { minWidth: 180, minHeight: 96 },
  compare: { minWidth: 180, minHeight: 96 },
  "logic-gate": { minWidth: 180, minHeight: 96 },
  multiplexer: { minWidth: 180, minHeight: 96 },
  /** Multi-pin live sensor sources — aligned preview + label rows. */
  "bmi270-input": { minWidth: 248, minHeight: 148 },
  "bmm350-input": { minWidth: 220, minHeight: 120 },
  "dps368-input": { minWidth: 220, minHeight: 120 },
  "sht40-input": { minWidth: 220, minHeight: 120 },
};

/** Output / viewport nodes default to manual canvas resize (Inspector → Canvas size). */
const DEFAULT_RESIZABLE_NODE_IDS = new Set<string>([
  "model-viewer",
  "scene-output",
  "plotter",
  "sparkline",
  "gauge",
  "radial-gauge",
  "bar-meter",
  "knob",
  "environment",
  "camera-view",
  "glb-animation-bundle",
  "audio-scope",
  "mic-input",
  "audio-output",
  "audio-file-player",
  "audio-oscillator",
]);

/** Default `ui.resizable` when unset on hydrate / new node (operator can toggle in Inspector). */
export function studioNodeDefaultResizable(nodeId: string): boolean {
  if (isPlotterNodeId(nodeId)) {
    return true;
  }
  if (isScene3dInspectorNodeId(nodeId)) {
    return true;
  }
  return DEFAULT_RESIZABLE_NODE_IDS.has(nodeId);
}

export function resolveStudioNodeMinDimensionFloor(nodeId: string): StudioNodeMinDimensions {
  if (isPlotterNodeId(nodeId)) {
    return MIN_BY_NODE_ID.plotter ?? STUDIO_NODE_DEFAULT_MIN_DIMENSIONS;
  }
  if (isScene3dInspectorNodeId(nodeId)) {
    return (
      MIN_BY_NODE_ID["rotation-3d-euler"] ?? STUDIO_NODE_DEFAULT_MIN_DIMENSIONS
    );
  }
  return MIN_BY_NODE_ID[nodeId] ?? STUDIO_NODE_DEFAULT_MIN_DIMENSIONS;
}

/** Merge catalog floors into `ui` when `minWidth` / `minHeight` are unset. */
export function applyStudioNodeMinDimensionsToUi(
  nodeId: string,
  ui: StudioNodeData["ui"] | undefined,
): StudioNodeData["ui"] {
  const floor = resolveStudioNodeMinDimensionFloor(nodeId);
  return {
    ...ui,
    minWidth:
      typeof ui?.minWidth === "number" && Number.isFinite(ui.minWidth)
        ? Math.round(ui.minWidth)
        : floor.minWidth,
    minHeight:
      typeof ui?.minHeight === "number" && Number.isFinite(ui.minHeight)
        ? Math.round(ui.minHeight)
        : floor.minHeight,
  };
}
