import { useMemo } from "react";
import {
  collectVisionPoseSketchSpecs,
  graphHasVisionPoseSketch,
} from "../../core/camera/collect-vision-pose-sketches";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import { VisionPoseSketchSvgLayer } from "./VisionPoseSketchSvgLayer";

export { graphHasVisionPoseSketch };

export function StudioVisionPoseSketchOverlay(props: {
  nodes: readonly FlowGraphNode[];
  edges?: readonly { source: string; target: string; targetHandle?: string | null; sourceHandle?: string | null }[];
}) {
  const specs = useMemo(
    () => collectVisionPoseSketchSpecs(props.nodes, props.edges),
    [props.nodes, props.edges],
  );

  return (
    <VisionPoseSketchSvgLayer
      specs={specs}
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
    />
  );
}
