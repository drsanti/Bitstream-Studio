import { isStudioFlexPlotCanvasNodeId } from "./studio-flex-plot-canvas";
import { isScene3dInspectorNodeId } from "../scene3d/scene3d-inspector-node-ids";
import type { StudioNodeData } from "../../store/flow-editor.store";

/** Canvas nodes whose body is the main visual (gauge, plotter, 3D, etc.). */
const STUDIO_VISUAL_CANVAS_BODY_NODE_IDS = new Set([
  "radial-gauge",
  "bar-meter",
  "knob",
  "model-viewer",
  "sparkline",
  "numeric-display",
  "led-indicator",
  "indicator",
]);

/** Default for Inspector + toolbar: visual nodes cannot collapse body until enabled. */
export function studioNodeDefaultAllowBodyCollapse(nodeId: string): boolean {
  if (isStudioFlexPlotCanvasNodeId(nodeId) || isScene3dInspectorNodeId(nodeId)) {
    return false;
  }
  return !STUDIO_VISUAL_CANVAS_BODY_NODE_IDS.has(nodeId);
}

export function studioNodeAllowsBodyCollapse(data: StudioNodeData): boolean {
  if (typeof data.ui?.allowBodyCollapse === "boolean") {
    return data.ui.allowBodyCollapse;
  }
  return studioNodeDefaultAllowBodyCollapse(data.nodeId);
}
