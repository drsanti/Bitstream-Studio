import type { Edge } from "@xyflow/react";
import type { NodeCatalogEntry } from "../config/config-types";
import {
  MESH_BUNDLE_NODE_TITLE,
  MESH_GROUP_NODE_ID,
} from "../../features/editor/nodes/mesh/mesh-group-inputs";
import {
  isMeshPrimitiveNodeId,
  meshPrimitiveKindLabel,
  meshPrimitiveKindForNodeId,
} from "../../features/editor/nodes/mesh/mesh-primitive-config";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import type { SceneObjectRefV1 } from "./scene-object-ref";
import { resolveStageObjectMeshSourceNodeIdForSelection } from "./stage-scene-transform-write";

function nodeDisplayLabel(node: FlowGraphNode): string {
  if (node.type !== "studio") {
    return node.id;
  }
  const label = node.data.label?.trim();
  return label != null && label.length > 0 ? label : node.data.nodeId;
}

export type StageObjectInspectorLabels = {
  objectTitle: string;
  objectSubtitle: string | null;
  meshSourceNodeId: string | null;
  writesViaBundle: boolean;
  bundleLeafIndex: number | null;
};

export function resolveStageObjectInspectorLabels(args: {
  selection: SceneObjectRefV1;
  boundNode: FlowGraphNode | null;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  boundCatalogTitle?: string;
}): StageObjectInspectorLabels {
  const meshSourceNodeId = resolveStageObjectMeshSourceNodeIdForSelection({
    selection: args.selection,
    nodes: args.nodes,
    edges: args.edges,
  });

  const bound =
    args.boundNode != null && args.boundNode.type === "studio" ? args.boundNode : null;
  const writesViaBundle = bound?.data.nodeId === MESH_GROUP_NODE_ID;
  const bundleLeafIndex =
    writesViaBundle && args.selection.kind === "procedural"
      ? (args.selection.meshLeafIndex ?? null)
      : null;

  const meshSource =
    meshSourceNodeId != null
      ? args.nodes.find((n) => n.id === meshSourceNodeId) ?? null
      : null;

  if (args.selection.kind === "glb-instance") {
    const boundTitle =
      args.boundCatalogTitle?.trim() ||
      (bound != null ? nodeDisplayLabel(bound) : args.selection.objectPath);
    return {
      objectTitle: boundTitle,
      objectSubtitle: `GLB · ${args.selection.objectPath}`,
      meshSourceNodeId: null,
      writesViaBundle: false,
      bundleLeafIndex: null,
    };
  }

  if (meshSource != null && meshSource.type === "studio") {
    const kind = meshPrimitiveKindForNodeId(meshSource.data.nodeId);
    const primitiveLabel =
      kind != null ? meshPrimitiveKindLabel(kind) : nodeDisplayLabel(meshSource);
    const objectTitle = nodeDisplayLabel(meshSource);
    const objectSubtitle = writesViaBundle
      ? `${primitiveLabel} · leaf ${(bundleLeafIndex ?? 0) + 1} of ${MESH_BUNDLE_NODE_TITLE}`
      : primitiveLabel;
    return {
      objectTitle,
      objectSubtitle,
      meshSourceNodeId,
      writesViaBundle,
      bundleLeafIndex,
    };
  }

  const fallbackTitle =
    args.boundCatalogTitle?.trim() ||
    (bound != null ? nodeDisplayLabel(bound) : args.selection.sourceNodeId);

  return {
    objectTitle: fallbackTitle,
    objectSubtitle: writesViaBundle
      ? `Wire a primitive mesh to bundle input ${(bundleLeafIndex ?? 0) + 1}`
      : "No editable mesh source for this selection",
    meshSourceNodeId: null,
    writesViaBundle,
    bundleLeafIndex,
  };
}

export function catalogTitleForNode(
  catalogEntries: readonly NodeCatalogEntry[],
  nodeId: string,
): string {
  return catalogEntries.find((e) => e.id === nodeId)?.title ?? nodeId;
}

export function isStageObjectGeometryEditable(meshSourceNode: FlowGraphNode | null): boolean {
  return (
    meshSourceNode != null &&
    meshSourceNode.type === "studio" &&
    isMeshPrimitiveNodeId(meshSourceNode.data.nodeId)
  );
}
