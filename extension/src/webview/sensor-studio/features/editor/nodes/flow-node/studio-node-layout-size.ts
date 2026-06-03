import type { StudioNode, StudioNodeData } from "../../store/flow-editor.store";
import {
  resolveStudioNodeMinDimensionFloor,
  type StudioNodeMinDimensions,
} from "./studio-node-resize-defaults";

/** Current RF box size (explicit dimensions or measured fallback). */
export function readStudioFlowNodeLayoutSize(node: StudioNode): {
  width: number;
  height: number;
} {
  const nodeWidth =
    typeof node.width === "number" && node.width > 0 ? Math.round(node.width) : undefined;
  const nodeHeight =
    typeof node.height === "number" && node.height > 0 ? Math.round(node.height) : undefined;
  const measuredWidth =
    typeof node.measured?.width === "number" && node.measured.width > 0
      ? Math.round(node.measured.width)
      : undefined;
  const measuredHeight =
    typeof node.measured?.height === "number" && node.measured.height > 0
      ? Math.round(node.measured.height)
      : undefined;
  const floor = resolveStudioNodeMinDimensionFloor(node.data.nodeId);
  return {
    width: nodeWidth ?? measuredWidth ?? floor.minWidth,
    height: nodeHeight ?? measuredHeight ?? floor.minHeight,
  };
}

/** Hard lower bound for any explicit width/height (inspector may go below content min). */
export const STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX = 1;

export function clampStudioFlowNodeLayoutDimension(value: number): number {
  return Math.max(
    STUDIO_FLOW_NODE_LAYOUT_ABSOLUTE_MIN_PX,
    Math.round(value),
  );
}

/** Minimum size enforced by canvas edge resize (not inspector scrubs). */
export function resolveStudioNodeEffectiveMinDimensions(
  nodeId: string,
  ui: StudioNodeData["ui"] | undefined,
): StudioNodeMinDimensions {
  const catalog = resolveStudioNodeMinDimensionFloor(nodeId);
  const baseW =
    typeof ui?.minWidth === "number" && Number.isFinite(ui.minWidth)
      ? Math.round(ui.minWidth)
      : catalog.minWidth;
  const baseH =
    typeof ui?.minHeight === "number" && Number.isFinite(ui.minHeight)
      ? Math.round(ui.minHeight)
      : catalog.minHeight;
  const contentW =
    typeof ui?.contentMinWidth === "number" && Number.isFinite(ui.contentMinWidth)
      ? Math.round(ui.contentMinWidth)
      : 0;
  const contentH =
    typeof ui?.contentMinHeight === "number" && Number.isFinite(ui.contentMinHeight)
      ? Math.round(ui.contentMinHeight)
      : 0;
  return {
    minWidth: Math.max(baseW, contentW),
    minHeight: Math.max(baseH, contentH),
  };
}
