import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import { buildFlowClipboardPayload } from "../clipboard/flow-clipboard";
import { buildFlowPresetFromCanvas } from "./build-flow-preset-from-canvas";
import type { StudioFlowPresetFile } from "./studio-flow-preset-file";

function nodesForPartialPresetUpdate(
  existing: StudioFlowPresetFile,
  nodes: readonly FlowGraphNode[],
): FlowGraphNode[] {
  const presetNodeIds = new Set(existing.document.nodes.map((node) => node.id));
  const matched = nodes.filter((node) => presetNodeIds.has(node.id));
  if (matched.length > 0) {
    return matched as FlowGraphNode[];
  }
  const selected = nodes.filter((node) => node.selected);
  if (selected.length > 0) {
    return selected as FlowGraphNode[];
  }
  return nodes as FlowGraphNode[];
}

export function buildFlowPresetUpdateFromCanvas(args: {
  existing: StudioFlowPresetFile;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  activeGraphId: string;
  rootNodes: readonly FlowGraphNode[];
  rootEdges: readonly Edge[];
}): StudioFlowPresetFile {
  const { existing, nodes, edges, subgraphs, activeGraphId, rootNodes, rootEdges } = args;
  const presetKind = existing.meta.presetKind;

  if (presetKind === "flowPartial") {
    const subsetNodes = nodesForPartialPresetUpdate(existing, nodes);
    const payload = buildFlowClipboardPayload(
      subsetNodes,
      edges as Edge[],
      subgraphs,
    );
    return buildFlowPresetFromCanvas({
      name: existing.meta.name,
      presetKind,
      nodes: payload.nodes,
      edges: payload.edges,
      subgraphs: payload.subgraphs ?? subgraphs,
      activeGraphId,
      rootNodes,
      rootEdges,
      category: existing.meta.category,
      description: existing.meta.description,
      tags: existing.meta.tags,
      existingMeta: existing.meta,
      sourceScopeId: existing.meta.sourceScopeId,
    });
  }

  return buildFlowPresetFromCanvas({
    name: existing.meta.name,
    presetKind,
    nodes,
    edges,
    subgraphs,
    activeGraphId,
    rootNodes,
    rootEdges,
    category: existing.meta.category,
    description: existing.meta.description,
    tags: existing.meta.tags,
    existingMeta: existing.meta,
    sourceScopeId: existing.meta.sourceScopeId,
  });
}
