import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import type { StudioSubgraphDocument } from "../subgraphs/studio-subgraph.types";
import {
  buildFlowClipboardPayload,
  remapFlowPaste,
  type FlowClipboardPayload,
} from "../clipboard/flow-clipboard";
import type { StudioFlowPresetDocument } from "./studio-flow-preset-file";

/** Build a clipboard-shaped payload from a saved flow document for merge paste. */
export function flowDocumentToClipboardPayload(
  document: StudioFlowPresetDocument,
): FlowClipboardPayload {
  const nodes = document.nodes as FlowGraphNode[];
  const edges = document.edges as Edge[];
  const subgraphs = document.subgraphs as Record<string, StudioSubgraphDocument> | undefined;
  return buildFlowClipboardPayload(nodes, edges, subgraphs);
}

export function remapFlowDocumentForMerge(document: StudioFlowPresetDocument) {
  return remapFlowPaste(flowDocumentToClipboardPayload(document));
}
