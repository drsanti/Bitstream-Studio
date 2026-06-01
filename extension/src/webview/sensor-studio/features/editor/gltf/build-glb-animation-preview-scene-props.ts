import type { RotationPreviewSceneProps } from "../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import type { FlowWireAnimationV1 } from "../nodes/animation/flow-wire-animation";
import {
  readStudioGlbAnimationPlaybackMode,
  resolveStudioGlbAnimationClipOrder,
} from "./studio-glb-animation-playback-mode";
import type { StudioGlbAnimationPlaybackModeV1 } from "./studio-glb-animation-playback-mode";
import {
  resolveStudioModelScopeNodeId,
  type StudioFlowEdgeLike,
} from "../model/model-generated-bindings";
import { mergeGlbAnimationClipDrivesForPreview } from "./merge-glb-animation-clip-drives";
import {
  collectGlbEventAnimationDrivesForModel,
  collectGlbScalarDrivesForModel,
} from "./studio-glb-flow-drives";

type FlowNodeLike = {
  id: string;
  data: { nodeId: string; defaultConfig: Record<string, unknown> };
};

export type GlbAnimationPreviewSceneProps = Pick<
  RotationPreviewSceneProps,
  | "glbAnimationTimeByClipName"
  | "glbAnimationTimeScaleByClipName"
  | "glbAnimationLoopByClipName"
  | "glbAnimationWeightByClipName"
  | "glbAnimationClipDrivesByName"
  | "glbAnimationPlaybackMode"
  | "glbAnimationClipOrder"
  | "glbAnimationInspectorTransportActive"
>;

/**
 * Build merged GLB animation mixer props for **Model Viewer** and **3D Rotation** previews.
 * Scalar scrub, bundle wire, and event triggers share the same merge priority as
 * {@link mergeGlbAnimationClipDrivesForPreview}.
 */
export function buildGlbAnimationPreviewSceneProps(args: {
  nodes: readonly FlowNodeLike[];
  edges?: readonly StudioFlowEdgeLike[];
  flowNodeId: string;
  catalogNodeId: string;
  defaultConfig: Record<string, unknown>;
  liveAnimationWire?: FlowWireAnimationV1 | null;
}): GlbAnimationPreviewSceneProps {
  const sourceModelNodeId = resolveStudioModelScopeNodeId({
    nodes: args.nodes,
    edges: args.edges,
    defaultConfig: args.defaultConfig,
    flowNodeId: args.flowNodeId,
    catalogNodeId: args.catalogNodeId,
  });

  const glbDrives = collectGlbScalarDrivesForModel(args.nodes, sourceModelNodeId, args.edges);
  const glbEventAnimDrives = collectGlbEventAnimationDrivesForModel(
    args.nodes,
    sourceModelNodeId,
    args.edges,
  );

  const mergedAnim = mergeGlbAnimationClipDrivesForPreview({
    scalarTimesByClipName: glbDrives.anims,
    wire: args.liveAnimationWire ?? null,
    eventDrivesByClipName: glbEventAnimDrives,
  });

  const wire = args.liveAnimationWire ?? null;
  const playbackMode: StudioGlbAnimationPlaybackModeV1 =
    wire?.playbackMode ?? readStudioGlbAnimationPlaybackMode(args.defaultConfig);
  const storedOrder =
    wire?.clipOrder ??
    (Array.isArray(args.defaultConfig.animationClipCardOrder)
      ? (args.defaultConfig.animationClipCardOrder as unknown[])
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim())
      : undefined);
  const clipOrder = resolveStudioGlbAnimationClipOrder({
    clipOrder: storedOrder,
    clipNames: Object.keys(mergedAnim.drives),
  });

  const mergedAnimKeys = Object.keys(mergedAnim.times);
  const scaleKeys = Object.keys(mergedAnim.scales);
  const loopKeys = Object.keys(mergedAnim.loops);
  const weightKeys = Object.keys(mergedAnim.weights);

  return {
    glbAnimationTimeByClipName: mergedAnimKeys.length > 0 ? mergedAnim.times : undefined,
    glbAnimationTimeScaleByClipName: scaleKeys.length > 0 ? mergedAnim.scales : undefined,
    glbAnimationLoopByClipName: loopKeys.length > 0 ? mergedAnim.loops : undefined,
    glbAnimationWeightByClipName: weightKeys.length > 0 ? mergedAnim.weights : undefined,
    glbAnimationClipDrivesByName:
      Object.keys(mergedAnim.drives).length > 0 ? mergedAnim.drives : undefined,
    glbAnimationPlaybackMode: playbackMode,
    glbAnimationClipOrder: clipOrder.length > 0 ? clipOrder : undefined,
    glbAnimationInspectorTransportActive: wire?.inspectorTransportActive,
  };
}
