import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { STUDIO_ROOT_GRAPH_ID } from "../subgraphs/studio-subgraph.types";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import { buildFlowClipboardPayload } from "../clipboard/flow-clipboard";
import { scanStudioGraphDependencies } from "../subgraphs/node-library/build-node-asset-from-group";
import {
  createStudioFlowPresetMeta,
  type StudioFlowPresetFile,
  type StudioFlowPresetKind,
} from "./studio-flow-preset-file";

function cloneNodeForPreset(node: FlowGraphNode): FlowGraphNode {
  const { selected: _selected, dragging: _dragging, ...rest } = node;
  return {
    ...rest,
    selected: false,
    data: structuredClone(rest.data),
  };
}

function cloneEdgeForPreset(edge: Edge): Edge {
  return { ...edge, selected: false };
}

function sourceScopeIdForFull(activeGraphId: string): string {
  return activeGraphId === STUDIO_ROOT_GRAPH_ID ? "__root__" : activeGraphId;
}

function sourceScopeIdForPartial(selectedIds: readonly string[]): string {
  return [...selectedIds].sort().join("|");
}

export function buildFlowPresetFromCanvas(args: {
  name: string;
  presetKind: StudioFlowPresetKind;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: string;
  rootNodes: readonly FlowGraphNode[];
  rootEdges: readonly Edge[];
  category?: StudioFlowPresetFile["meta"]["category"];
  description?: string;
  tags?: string[];
  sourceScopeId?: string;
  existingMeta?: Partial<StudioFlowPresetFile["meta"]>;
}): StudioFlowPresetFile {
  const {
    name,
    presetKind,
    nodes,
    edges,
    subgraphs,
    activeGraphId,
    rootNodes,
    rootEdges,
    category,
    description,
    tags,
    sourceScopeId,
    existingMeta,
  } = args;

  let exportNodes: FlowGraphNode[];
  let exportEdges: Edge[];
  let exportSubgraphs: Record<string, StudioSubgraphDocument> | undefined;
  let scopeId = sourceScopeId;

  if (presetKind === "flowPartial") {
    const payload = buildFlowClipboardPayload(
      nodes as FlowGraphNode[],
      edges as Edge[],
      subgraphs,
    );
    exportNodes = payload.nodes;
    exportEdges = payload.edges;
    exportSubgraphs = payload.subgraphs;
    scopeId = sourceScopeId ?? sourceScopeIdForPartial(exportNodes.map((n) => n.id));
  } else if (activeGraphId === STUDIO_ROOT_GRAPH_ID) {
    exportNodes = rootNodes.map(cloneNodeForPreset);
    exportEdges = rootEdges.map(cloneEdgeForPreset);
    exportSubgraphs =
      Object.keys(subgraphs).length > 0 ? structuredClone(subgraphs) : undefined;
    scopeId = sourceScopeId ?? sourceScopeIdForFull(activeGraphId);
  } else {
    exportNodes = nodes.map(cloneNodeForPreset);
    exportEdges = edges.map(cloneEdgeForPreset);
    const usedSubgraphs: Record<string, StudioSubgraphDocument> = {};
    for (const node of exportNodes) {
      if (node.type === "studio-node-group") {
        const subId =
          (node.data as { subgraphId?: string }).subgraphId ?? node.id;
        if (subgraphs[subId] != null) {
          usedSubgraphs[subId] = structuredClone(subgraphs[subId]!);
        }
      }
    }
    exportSubgraphs = Object.keys(usedSubgraphs).length > 0 ? usedSubgraphs : undefined;
    scopeId = sourceScopeId ?? sourceScopeIdForFull(activeGraphId);
  }

  const dependencies = scanStudioGraphDependencies(exportNodes);

  const meta = createStudioFlowPresetMeta(name, {
    ...existingMeta,
    category: category ?? existingMeta?.category ?? "custom",
    description: description ?? existingMeta?.description,
    tags: tags ?? existingMeta?.tags,
    presetKind,
    activeGraphId,
    sourceScopeId: scopeId,
  });

  return {
    marker: "trn-flow-preset",
    version: 1,
    meta,
    document: {
      version: 1,
      nodes: exportNodes,
      edges: exportEdges,
      ...(exportSubgraphs != null ? { subgraphs: exportSubgraphs } : {}),
      ...(presetKind === "flowFull" && activeGraphId === STUDIO_ROOT_GRAPH_ID
        ? { rootNodes: exportNodes, rootEdges: exportEdges }
        : {}),
      ...(activeGraphId !== STUDIO_ROOT_GRAPH_ID ? { activeGraphId } : {}),
    },
    dependencies,
  };
}
