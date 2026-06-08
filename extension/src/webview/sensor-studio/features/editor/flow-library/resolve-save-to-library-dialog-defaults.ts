import type { StudioFlowPresetCategory } from "./studio-flow-preset-file";
import { findLinkedFlowPreset } from "./flow-preset-upsert";
import { resolveSaveToLibraryTarget, type SaveToLibraryTarget } from "./resolve-save-to-library-target";
import { isStudioFlowNode } from "../layout/layout-port-resolution";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { isStudioNodeGroupNode } from "../subgraphs/studio-subgraph.types";
import { STUDIO_ROOT_GRAPH_ID } from "../subgraphs/studio-subgraph.types";
import { findLinkedStudioLibraryPreset } from "../subgraphs/node-library/library-preset-upsert";
import type {
  StudioNodeAssetCategory,
  StudioNodeAssetFile,
} from "../subgraphs/node-library/studio-node-asset-file";
import type { StudioFlowPresetFile } from "./studio-flow-preset-file";

export type SaveToLibraryDialogDefaults = {
  target: SaveToLibraryTarget;
  scopeHint: string;
  defaultName: string;
  defaultDescription: string;
  defaultFlowCategory: StudioFlowPresetCategory;
  defaultGroupCategory: StudioNodeAssetCategory;
  linkedPresetName: string | null;
};

function resolveGroupTitle(node: FlowGraphNode): string {
  const data = node.data as { graphTitle?: string };
  const fromData = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
  return fromData.length > 0 ? fromData : "Node Group";
}

function resolveFlowDefaultName(nodes: readonly FlowGraphNode[]): string {
  const selected = nodes.filter((n) => n.selected);
  if (selected.length === 1 && isStudioFlowNode(selected[0]!)) {
    const label = (selected[0]!.data as { label?: string }).label?.trim();
    if (label != null && label.length > 0) {
      return label;
    }
  }
  if (selected.length > 0) {
    return `Selection (${selected.length} nodes)`;
  }
  return "Flow preset";
}

export function resolveSaveToLibraryDialogDefaults(args: {
  nodes: readonly FlowGraphNode[];
  activeGraphId: string;
  nodeGroupLibrary: readonly StudioNodeAssetFile[];
  flowPresetLibrary: readonly StudioFlowPresetFile[];
}): SaveToLibraryDialogDefaults {
  const { nodes, activeGraphId, nodeGroupLibrary, flowPresetLibrary } = args;
  const target = resolveSaveToLibraryTarget(nodes);
  const scopeHint =
    activeGraphId === STUDIO_ROOT_GRAPH_ID ? "Root graph" : `Graph ${activeGraphId}`;

  if (target === "group") {
    const host = nodes.find((n) => n.selected && isStudioNodeGroupNode(n));
    const defaultName = host != null ? resolveGroupTitle(host) : "Node Group";
    const linked = host != null
      ? findLinkedStudioLibraryPreset(nodeGroupLibrary, {
          sourceNodeId: host.id,
          presetKind: "nodeGraph",
        })
      : undefined;
    return {
      target,
      scopeHint,
      defaultName: linked?.meta.name ?? defaultName,
      defaultDescription: linked?.meta.description ?? "",
      defaultFlowCategory: "custom",
      defaultGroupCategory: linked?.meta.category ?? "composition",
      linkedPresetName: linked?.meta.name ?? null,
    };
  }

  const presetKind = target === "flow-full" ? "flowFull" : "flowPartial";
  const sourceScopeId =
    presetKind === "flowFull"
      ? activeGraphId === STUDIO_ROOT_GRAPH_ID
        ? "__root__"
        : activeGraphId
      : [...nodes.filter((n) => n.selected).map((n) => n.id)].sort().join("|");
  const linked = findLinkedFlowPreset(flowPresetLibrary, {
    sourceScopeId,
    presetKind,
  });

  return {
    target,
    scopeHint,
    defaultName: linked?.meta.name ?? resolveFlowDefaultName(nodes),
    defaultDescription: linked?.meta.description ?? "",
    defaultFlowCategory: linked?.meta.category ?? "custom",
    defaultGroupCategory: "composition",
    linkedPresetName: linked?.meta.name ?? null,
  };
}
