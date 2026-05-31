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
  collectGlbScalarDrivesForModel,
} from "./studio-glb-flow-drives";

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveValue?: unknown;
    liveVector3Wire?: { x: number; y: number; z: number };
  };
};

export type GlbScalarPreviewSceneProps = Pick<
  RotationPreviewSceneProps,
  | "glbMorphWeights"
  | "glbLightIntensityByName"
  | "glbPartVisibilityByPath"
  | "glbMaterialPbrByName"
  | "glbMaterialTexturesByName"
  | "glbMaterialColorsByName"
  | "glbCameraDriveByName"
>;

/** GLB scalar + material drive maps for 3D previews. */
export function buildGlbScalarPreviewSceneProps(args: {
  nodes: readonly FlowNodeLike[];
  edges?: readonly StudioFlowEdgeLike[];
  flowNodeId: string;
  catalogNodeId: string;
  defaultConfig: Record<string, unknown>;
}): GlbScalarPreviewSceneProps {
  const sourceModelNodeId = resolveStudioModelScopeNodeId({
    nodes: args.nodes,
    edges: args.edges,
    defaultConfig: args.defaultConfig,
    flowNodeId: args.flowNodeId,
    catalogNodeId: args.catalogNodeId,
  });

  const glbDrives = collectGlbScalarDrivesForModel(args.nodes, sourceModelNodeId, args.edges);
  const materialEval = evaluateMaterialGraphForModel(args.nodes, sourceModelNodeId, args.edges);
  const materialCompact = compactMaterialGraphEvaluation(materialEval);
  const morphKeys = Object.keys(glbDrives.morphs);
  const lightKeys = Object.keys(glbDrives.lights);
  const partKeys = Object.keys(glbDrives.parts);
  const cameraKeys = Object.keys(glbDrives.cameras);

  return {
    glbMorphWeights: morphKeys.length > 0 ? glbDrives.morphs : undefined,
    glbLightIntensityByName: lightKeys.length > 0 ? glbDrives.lights : undefined,
    glbPartVisibilityByPath: partKeys.length > 0 ? glbDrives.parts : undefined,
    glbMaterialPbrByName: materialCompact.glbMaterialPbrByName,
    glbMaterialTexturesByName: materialCompact.glbMaterialTexturesByName,
    glbMaterialColorsByName: materialCompact.glbMaterialColorsByName,
    glbCameraDriveByName: cameraKeys.length > 0 ? glbDrives.cameras : undefined,
  };
}
