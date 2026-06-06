import type { RotationPreviewSceneProps } from "../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import {
  compactMaterialGraphEvaluation,
  evaluateMaterialGraphForModel,
} from "../../../core/flow/material-domain-eval";
import {
  resolveStudioModelScopeNodeId,
  type StudioFlowEdgeLike,
} from "../model/model-generated-bindings";
import {
  collectFlowCameraSwitchIndexForModel,
  collectFlowCameraSwitchRigForModel,
  collectFlowMorphTargetDrivesForModel,
  collectFlowSceneLightGlbDrivesForModel,
  collectGlbScalarDrivesForModel,
} from "./studio-glb-flow-drives";
import type { FlowWireStudioLightV1 } from "../nodes/scene-fx/flow-wire-studio-light";
import { collectCss3dCameraFeeds } from "../../../core/camera/studio-camera-css3d-feed";
import type { FlowWireVideoBusV1 } from "../../../core/camera/flow-wire-video";
import type { FlowWireVideoTextureV1 } from "../../../core/camera/flow-wire-video";

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveValue?: unknown;
    liveVector3Wire?: { x: number; y: number; z: number };
    liveVideoBusWire?: FlowWireVideoBusV1;
    liveVideoTextureWire?: FlowWireVideoTextureV1;
    liveInputBooleanByHandle?: Record<string, boolean>;
    liveInputNumberByHandle?: Record<string, number>;
  };
};

export type GlbScalarPreviewSceneProps = Pick<
  RotationPreviewSceneProps,
  | "glbMorphWeights"
  | "glbLightIntensityByName"
  | "glbPartVisibilityByPath"
  | "glbMaterialPbrByName"
  | "glbMaterialTexturesByName"
  | "glbMaterialVideosByName"
  | "glbMaterialColorsByName"
  | "cameraCss3dFeeds"
  | "glbCameraDriveByName"
  | "glbCameraSwitchIndex"
  | "glbCameraSwitchRig"
>;

/** GLB scalar + material drive maps for 3D previews. */
export function buildGlbScalarPreviewSceneProps(args: {
  nodes: readonly FlowNodeLike[];
  edges?: readonly StudioFlowEdgeLike[];
  flowNodeId: string;
  catalogNodeId: string;
  defaultConfig: Record<string, unknown>;
  liveStudioLightWire?: FlowWireStudioLightV1 | null;
}): GlbScalarPreviewSceneProps {
  const sourceModelNodeId = resolveStudioModelScopeNodeId({
    nodes: args.nodes,
    edges: args.edges,
    defaultConfig: args.defaultConfig,
    flowNodeId: args.flowNodeId,
    catalogNodeId: args.catalogNodeId,
  });

  const glbDrives = collectGlbScalarDrivesForModel(args.nodes, sourceModelNodeId, args.edges);
  const flowMorphs = collectFlowMorphTargetDrivesForModel(args.nodes, sourceModelNodeId, args.edges);
  const flowSceneLights = collectFlowSceneLightGlbDrivesForModel(args.nodes, sourceModelNodeId, args.edges);
  const cameraSwitchIndex = collectFlowCameraSwitchIndexForModel(args.nodes, sourceModelNodeId, args.edges);
  const cameraSwitchRig = collectFlowCameraSwitchRigForModel(args.nodes, sourceModelNodeId, args.edges);
  const materialEval = evaluateMaterialGraphForModel(args.nodes, sourceModelNodeId, args.edges);
  const materialCompact = compactMaterialGraphEvaluation(materialEval);
  const morphs = { ...glbDrives.morphs, ...flowMorphs };
  const lights = { ...glbDrives.lights, ...flowSceneLights };
  if (args.liveStudioLightWire?.glbLightName) {
    lights[args.liveStudioLightWire.glbLightName] = args.liveStudioLightWire.intensity;
  }
  const morphKeys = Object.keys(morphs);
  const lightKeys = Object.keys(lights);
  const partKeys = Object.keys(glbDrives.parts);
  const cameraKeys = Object.keys(glbDrives.cameras);

  return {
    glbMorphWeights: morphKeys.length > 0 ? morphs : undefined,
    glbLightIntensityByName: lightKeys.length > 0 ? lights : undefined,
    glbPartVisibilityByPath: partKeys.length > 0 ? glbDrives.parts : undefined,
    glbMaterialPbrByName: materialCompact.glbMaterialPbrByName,
    glbMaterialTexturesByName: materialCompact.glbMaterialTexturesByName,
    glbMaterialVideosByName: materialCompact.glbMaterialVideosByName,
    glbMaterialColorsByName: materialCompact.glbMaterialColorsByName,
    cameraCss3dFeeds: (() => {
      const feeds = collectCss3dCameraFeeds(args.nodes);
      return feeds.length > 0 ? feeds : undefined;
    })(),
    glbCameraDriveByName: cameraKeys.length > 0 ? glbDrives.cameras : undefined,
    glbCameraSwitchIndex: cameraSwitchIndex ?? undefined,
    glbCameraSwitchRig: cameraSwitchRig ?? undefined,
  };
}
