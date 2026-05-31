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

function collectStudioNodeIds(nodes: ReadonlyArray<{ type?: string; data?: unknown }>): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.type !== "studio") {
      continue;
    }
    const data = node.data as { nodeId?: string } | undefined;
    if (typeof data?.nodeId === "string") {
      ids.push(data.nodeId);
    }
  }
  return ids;
}

/** Scan root graph + nested subgraph documents for Domain D material nodes. */
export function graphNeedsMaterialDomainEvalInGraph(args: {
  nodes: ReadonlyArray<{ type?: string; data?: unknown }>;
  rootNodes?: ReadonlyArray<{ type?: string; data?: unknown }>;
  subgraphs?: Record<string, { nodes: ReadonlyArray<{ type?: string; data?: unknown }> }>;
}): boolean {
  const buckets = [args.nodes, args.rootNodes ?? [], ...Object.values(args.subgraphs ?? {}).map((s) => s.nodes)];
  for (const list of buckets) {
    if (graphNeedsMaterialDomainEval(collectStudioNodeIds(list).map((nodeId) => ({ data: { nodeId } })))) {
      return true;
    }
  }
  return false;
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
