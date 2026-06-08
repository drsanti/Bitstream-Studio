import type { TRNSelectOption } from "../../../ui/TRN";
import type { StudioAssetDescriptor } from "../../asset-browser/studio-asset.types";
import { modelSelectEmitDisplayName } from "../nodes/animation/model-select-emit-display-name";
import {
  readSourceModelNodeId,
  resolveFallbackSingleModelSelectNodeId,
  resolveWiredStudioModelSelectNodeId,
  STUDIO_HANDLE_MODEL,
  type StudioFlowEdgeLike,
} from "./model-generated-bindings";

export const GLB_MODEL_SOURCE_UNBOUND = "__model_unbound__";

export type StudioModelSelectFlowNodeLike = {
  id: string;
  data: {
    nodeId: string;
    label?: string;
    defaultConfig: Record<string, unknown>;
  };
};

/** **Model** socket wire on nodes with `catalogNodeHasStudioModelInput`. */
export function resolveWiredStudioModelFlowId(
  flowNodeId: string,
  nodes: readonly StudioModelSelectFlowNodeLike[],
  edges: readonly StudioFlowEdgeLike[],
): string | undefined {
  return resolveWiredStudioModelSelectNodeId({
    targetFlowNodeId: flowNodeId,
    targetHandle: STUDIO_HANDLE_MODEL,
    edges,
    nodes,
  });
}

export function listCanvasModelSelectNodes(
  nodes: readonly StudioModelSelectFlowNodeLike[],
): StudioModelSelectFlowNodeLike[] {
  return nodes.filter((n) => n.data.nodeId === "model-select");
}

export function formatStudioModelSelectOptionLabel(
  node: StudioModelSelectFlowNodeLike,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const catalogLabel = modelSelectEmitDisplayName(node.data.defaultConfig, descriptors);
  const nodeLabel =
    typeof node.data.label === "string" && node.data.label.trim().length > 0
      ? node.data.label.trim()
      : "";
  if (nodeLabel.length > 0 && catalogLabel.length > 0 && nodeLabel !== catalogLabel) {
    return `${nodeLabel} · ${catalogLabel}`;
  }
  if (catalogLabel.length > 0) {
    return catalogLabel;
  }
  if (nodeLabel.length > 0) {
    return nodeLabel;
  }
  return "Model Source";
}

export function buildStudioModelSourceSelectOptions(
  nodes: readonly StudioModelSelectFlowNodeLike[],
  descriptors: readonly StudioAssetDescriptor[],
): TRNSelectOption[] {
  return listCanvasModelSelectNodes(nodes).map((n) => ({
    value: n.id,
    label: formatStudioModelSelectOptionLabel(n, descriptors),
  }));
}

/** Dropdown value when **Model** socket is unwired (config → sole canvas fallback → sentinel). */
export function resolveUnwiredStudioModelSourceSelectValue(
  config: Record<string, unknown>,
  nodes: readonly StudioModelSelectFlowNodeLike[],
): string {
  const fromConfig = readSourceModelNodeId(config);
  if (fromConfig != null) {
    const exists = nodes.some((n) => n.id === fromConfig && n.data.nodeId === "model-select");
    if (exists) {
      return fromConfig;
    }
  }
  const fallback = resolveFallbackSingleModelSelectNodeId(nodes);
  if (fallback != null) {
    return fallback;
  }
  return GLB_MODEL_SOURCE_UNBOUND;
}
