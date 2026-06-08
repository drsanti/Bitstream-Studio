import { Link2 } from "lucide-react";
import { useMemo } from "react";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import { modelSelectEmitDisplayName } from "../../nodes/animation/model-select-emit-display-name";
import {
  readGlbExtractTag,
  readSourceModelNodeId,
  resolveLinkedStudioModelDisplayLabel,
} from "../../model/model-generated-bindings";
import type { StudioNode } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";

const NODE_IDS_WITH_STUDIO_MODEL_SCOPE = new Set([
  "model-viewer",
  "glb-animation-bundle",
  "animation-clip",
  "part-spin",
  "glb-part-transform",
  "event-trigger-glb-anim",
  "event-toggle-glb-part",
  "event-set-glb-part",
  "number-constant",
]);

function shouldShowLinkedStudioModelSection(node: StudioNode): boolean {
  const catalogNodeId = node.data.nodeId;
  if (!NODE_IDS_WITH_STUDIO_MODEL_SCOPE.has(catalogNodeId)) {
    return false;
  }
  if (catalogNodeId === "number-constant") {
    const dc = node.data.defaultConfig;
    return (
      readGlbExtractTag(dc) != null || readSourceModelNodeId(dc) != null
    );
  }
  return true;
}

export type InspectorLinkedStudioModelSectionProps = {
  selectedNode: StudioNode;
};

/**
 * Shows which **Studio Model** scopes GLB-linked nodes — canvas cards no longer repeat this in the header.
 */
export function InspectorLinkedStudioModelSection(
  props: InspectorLinkedStudioModelSectionProps,
) {
  const { selectedNode } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const { descriptors } = useStudioAssetDescriptors();

  const link = useMemo(() => {
    if (!shouldShowLinkedStudioModelSection(selectedNode)) {
      return null;
    }
    const base = resolveLinkedStudioModelDisplayLabel(selectedNode, nodes, edges);
    if (base == null) {
      return null;
    }
    const parent = nodes.find((n) => n.id === base.modelFlowId);
    if (parent?.data.nodeId !== "model-select") {
      return base;
    }
    const catalogLabel = modelSelectEmitDisplayName(
      parent.data.defaultConfig as Record<string, unknown>,
      descriptors,
    );
    if (catalogLabel.length === 0) {
      return base;
    }
    const nodeLabel =
      typeof parent.data.label === "string" && parent.data.label.trim().length > 0
        ? parent.data.label.trim()
        : "";
    return {
      ...base,
      displayLabel: catalogLabel,
      nodeLabel: nodeLabel.length > 0 && nodeLabel !== catalogLabel ? nodeLabel : undefined,
    };
  }, [selectedNode, nodes, edges, descriptors]);

  if (link == null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 rounded border border-zinc-700/60 bg-zinc-900/40 px-2 py-1.5 text-[11px] text-zinc-400">
      <Link2 className="h-3.5 w-3.5 shrink-0 text-cyan-500/80" aria-hidden />
      <span className="min-w-0">
        Linked model source ·{" "}
        <span className="font-medium text-zinc-200">{link.displayLabel}</span>
        {"nodeLabel" in link && link.nodeLabel != null ? (
          <span className="ml-1 truncate text-zinc-500">({link.nodeLabel})</span>
        ) : null}
      </span>
    </div>
  );
}
