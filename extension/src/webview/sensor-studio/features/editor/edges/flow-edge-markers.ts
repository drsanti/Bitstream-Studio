import { MarkerType, type EdgeMarker } from "@xyflow/react";
import type { FlowCanvasEdgeMarkerSize } from "../../../persistence/flow-canvas-preferences";

export function buildFlowEdgeMarkerEnd(
  stroke: string,
  size: FlowCanvasEdgeMarkerSize,
): EdgeMarker {
  const dim = size === "medium" ? 18 : 12;
  return {
    type: MarkerType.ArrowClosed,
    color: stroke,
    width: dim,
    height: dim,
  };
}
