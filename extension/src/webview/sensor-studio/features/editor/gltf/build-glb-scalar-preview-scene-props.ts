import type { RotationPreviewSceneProps } from "../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import {
  resolveStudioModelScopeNodeId,
  type StudioFlowEdgeLike,
} from "../model/model-generated-bindings";
import { glbMaterialPbrRowHasValues } from "./studio-glb-material-param";
import { glbMaterialTextureRowHasValues } from "./studio-glb-material-texture";
import {
  collectGlbMaterialTextureDrivesForModel,
  collectGlbScalarDrivesForModel,
} from "./studio-glb-flow-drives";

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveValue?: unknown;
  };
};

export type GlbScalarPreviewSceneProps = Pick<
  RotationPreviewSceneProps,
  | "glbMorphWeights"
  | "glbLightIntensityByName"
  | "glbPartVisibilityByPath"
  | "glbMaterialPbrByName"
  | "glbMaterialTexturesByName"
  | "glbCameraDriveByName"
>;

/** GLB scalar drive maps (morph, part opacity/visibility, material PBR, camera, light) for 3D previews. */
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
  const glbTextureDrives = collectGlbMaterialTextureDrivesForModel(
    args.nodes,
    sourceModelNodeId,
    args.edges,
  );
  const morphKeys = Object.keys(glbDrives.morphs);
  const lightKeys = Object.keys(glbDrives.lights);
  const partKeys = Object.keys(glbDrives.parts);
  const materialPbrKeys = Object.keys(glbDrives.materialPbr).filter((k) =>
    glbMaterialPbrRowHasValues(glbDrives.materialPbr[k]),
  );
  const materialTextureKeys = Object.keys(glbTextureDrives).filter((k) =>
    glbMaterialTextureRowHasValues(glbTextureDrives[k]),
  );
  const cameraKeys = Object.keys(glbDrives.cameras);

  return {
    glbMorphWeights: morphKeys.length > 0 ? glbDrives.morphs : undefined,
    glbLightIntensityByName: lightKeys.length > 0 ? glbDrives.lights : undefined,
    glbPartVisibilityByPath: partKeys.length > 0 ? glbDrives.parts : undefined,
    glbMaterialPbrByName:
      materialPbrKeys.length > 0 ? glbDrives.materialPbr : undefined,
    glbMaterialTexturesByName:
      materialTextureKeys.length > 0 ? glbTextureDrives : undefined,
    glbCameraDriveByName: cameraKeys.length > 0 ? glbDrives.cameras : undefined,
  };
}
