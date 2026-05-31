import type { StudioFlowEdgeLike } from "../../features/editor/model/model-generated-bindings";
import {
  collectGlbMaterialColorDrivesForModel,
  collectGlbMaterialTextureDrivesForModel,
  collectGlbScalarDrivesForModel,
} from "../../features/editor/gltf/studio-glb-flow-drives";
import type { GlbMaterialColorDriveRow } from "../../features/editor/gltf/studio-glb-material-color";
import { glbMaterialColorRowHasValues } from "../../features/editor/gltf/studio-glb-material-color";
import type { GlbMaterialPbrDriveRow } from "../../features/editor/gltf/studio-glb-material-param";
import { glbMaterialPbrRowHasValues } from "../../features/editor/gltf/studio-glb-material-param";
import type { GlbMaterialTextureDriveRow } from "../../features/editor/gltf/studio-glb-material-texture";
import { glbMaterialTextureRowHasValues } from "../../features/editor/gltf/studio-glb-material-texture";

/** Domain D (material / PBR) node catalog ids — evaluated on graph tick, not UART-only. */
export const MATERIAL_DOMAIN_NODE_IDS: ReadonlySet<string> = new Set([
  "glb-material-param",
  "glb-material-texture",
  "glb-material-color",
  "material-mix",
]);

type FlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    defaultConfig: Record<string, unknown>;
    liveValue?: unknown;
    liveVector3Wire?: { x: number; y: number; z: number };
  };
};

export type MaterialGraphEvaluation = {
  materialPbr: Record<string, GlbMaterialPbrDriveRow>;
  materialTextures: Record<string, GlbMaterialTextureDriveRow>;
  materialColors: Record<string, GlbMaterialColorDriveRow>;
};

export function graphNeedsMaterialDomainEval(nodes: ReadonlyArray<{ data: { nodeId: string } }>): boolean {
  return nodes.some((node) => MATERIAL_DOMAIN_NODE_IDS.has(node.data.nodeId));
}

/** Collect material scalar, texture, and color drives for one Model scope (Domain D). */
export function evaluateMaterialGraphForModel(
  nodes: readonly FlowNodeLike[],
  sourceModelNodeId: string,
  edges?: readonly StudioFlowEdgeLike[],
): MaterialGraphEvaluation {
  const scalars = collectGlbScalarDrivesForModel(nodes, sourceModelNodeId, edges);
  const materialTextures = collectGlbMaterialTextureDrivesForModel(
    nodes,
    sourceModelNodeId,
    edges,
  );
  const materialColors = collectGlbMaterialColorDrivesForModel(
    nodes,
    sourceModelNodeId,
    edges,
  );
  return {
    materialPbr: scalars.materialPbr,
    materialTextures,
    materialColors,
  };
}

export function compactMaterialGraphEvaluation(
  evalResult: MaterialGraphEvaluation,
): {
  glbMaterialPbrByName?: Record<string, GlbMaterialPbrDriveRow>;
  glbMaterialTexturesByName?: Record<string, GlbMaterialTextureDriveRow>;
  glbMaterialColorsByName?: Record<string, GlbMaterialColorDriveRow>;
} {
  const materialPbrKeys = Object.keys(evalResult.materialPbr).filter((k) =>
    glbMaterialPbrRowHasValues(evalResult.materialPbr[k]),
  );
  const materialTextureKeys = Object.keys(evalResult.materialTextures).filter((k) =>
    glbMaterialTextureRowHasValues(evalResult.materialTextures[k]),
  );
  const materialColorKeys = Object.keys(evalResult.materialColors).filter((k) =>
    glbMaterialColorRowHasValues(evalResult.materialColors[k]),
  );
  return {
    glbMaterialPbrByName:
      materialPbrKeys.length > 0 ? evalResult.materialPbr : undefined,
    glbMaterialTexturesByName:
      materialTextureKeys.length > 0 ? evalResult.materialTextures : undefined,
    glbMaterialColorsByName:
      materialColorKeys.length > 0 ? evalResult.materialColors : undefined,
  };
}
