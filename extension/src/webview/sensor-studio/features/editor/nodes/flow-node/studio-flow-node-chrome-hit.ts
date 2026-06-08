import { isScene3dInspectorNodeId } from "../scene3d/scene3d-inspector-node-ids";
import { isStudioFlexPlotCanvasNodeId } from "./studio-flex-plot-canvas";
import {
  STUDIO_NODE_DEFAULT_MIN_DIMENSIONS,
  type StudioNodeMinDimensions,
} from "./studio-node-resize-defaults";

/** Nodes whose body flex-fills a user-resized card height (plot, gauge, 3D viewport). */
const STUDIO_FLOW_NODE_MANUAL_HEIGHT_RESIZE_IDS = new Set([
  "radial-gauge",
  "bar-meter",
  "knob",
]);

export function isStudioFlowNodeManualHeightResize(nodeId: string): boolean {
  if (isStudioFlexPlotCanvasNodeId(nodeId)) {
    return true;
  }
  if (isScene3dInspectorNodeId(nodeId)) {
    return true;
  }
  return STUDIO_FLOW_NODE_MANUAL_HEIGHT_RESIZE_IDS.has(nodeId);
}

/**
 * Default for catalog studio nodes: RF box tracks visible chrome (no empty wrapper band).
 * Height is content-fitted; width may still be edge-resized.
 */
export function isStudioFlowNodeChromeHitFit(nodeId: string): boolean {
  return !isStudioFlowNodeManualHeightResize(nodeId);
}

export const SUBGRAPH_FLOW_NODE_CHROME_HIT_TYPES = new Set([
  "studio-node-group",
  "studio-group-input",
  "studio-group-output",
]);

export function isSubgraphFlowNodeChromeHitFit(nodeType: string): boolean {
  return SUBGRAPH_FLOW_NODE_CHROME_HIT_TYPES.has(nodeType);
}

export function shouldApplyFlowNodeChromeHitClass(args: {
  nodeType: string;
  catalogNodeId?: string;
}): boolean {
  if (args.nodeType === "studio") {
    return (
      typeof args.catalogNodeId === "string" &&
      isStudioFlowNodeChromeHitFit(args.catalogNodeId)
    );
  }
  return isSubgraphFlowNodeChromeHitFit(args.nodeType);
}

export function appendFlowNodeChromeHitClass(
  className: string | undefined,
): string {
  const existing = className ?? "";
  if (existing.includes("studio-flow-node--chrome-hit")) {
    return existing;
  }
  return `${existing} studio-flow-node--chrome-hit`.trim();
}

/** RF height floor when auto-fitting content-wrapped nodes. */
export function resolveStudioFlowNodeChromeHitLayoutHeightFloor(
  measuredContentPx: number,
): number {
  return Math.max(
    STUDIO_NODE_DEFAULT_MIN_DIMENSIONS.minHeight,
    Math.ceil(measuredContentPx),
  );
}

/** Resize / ui.minHeight floor for content-wrapped nodes — follows measured chrome. */
export function resolveStudioFlowNodeChromeHitEffectiveMinHeight(
  measuredContentPx: number | null,
  catalogFloor: StudioNodeMinDimensions,
): number {
  if (measuredContentPx != null && measuredContentPx > 0) {
    return resolveStudioFlowNodeChromeHitLayoutHeightFloor(measuredContentPx);
  }
  return Math.max(
    STUDIO_NODE_DEFAULT_MIN_DIMENSIONS.minHeight,
    Math.min(catalogFloor.minHeight, 96),
  );
}
