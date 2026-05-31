import { useCallback, useMemo } from "react";
import { Copy, FolderOpen, Link2, LogIn, LogOut, Plus, Ungroup } from "lucide-react";
import {
  TRNButton,
  TRNFormField,
  TRNHintText,
  TRNInlineEdit,
} from "../../../../../ui/TRN";
import { createManualGroupSocket } from "../../subgraphs/studio-group-interface-sync";
import { countStudioSubgraphHosts } from "../../subgraphs/duplicate-group-instance";
import {
  emptyGroupInterface,
  isStudioGroupBoundaryNode,
  isStudioNodeGroupNode,
  STUDIO_ROOT_GRAPH_ID,
  type StudioGroupInterface,
  type StudioNodeGroupData,
} from "../../subgraphs/studio-subgraph.types";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { GroupSocketSortableList } from "./GroupSocketSortableList";
import { InspectorCollapsibleSection } from "./InspectorCollapsibleSection";

type NodeGroupInspectorSectionProps = {
  hostNodeId: string;
  data: StudioNodeGroupData;
  /** When a boundary node is selected inside the group, show which role is focused. */
  focusedBoundaryRole?: "input" | "output" | null;
};

export function NodeGroupInspectorSection(props: NodeGroupInspectorSectionProps) {
  const { hostNodeId, data, focusedBoundaryRole = null } = props;
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const rootNodes = useFlowEditorStore((s) => s.rootNodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const updateNodeGroupInterface = useFlowEditorStore((s) => s.updateNodeGroupInterface);
  const updateNodeGroupTitle = useFlowEditorStore((s) => s.updateNodeGroupTitle);
  const enterGroup = useFlowEditorStore((s) => s.enterGroup);
  const ungroupNodeGroup = useFlowEditorStore((s) => s.ungroupNodeGroup);
  const duplicateGroupLinked = useFlowEditorStore((s) => s.duplicateGroupLinked);
  const duplicateGroupDeepCopy = useFlowEditorStore((s) => s.duplicateGroupDeepCopy);

  const subgraphId = data.subgraphId ?? hostNodeId;
  const subgraphDoc = subgraphs[subgraphId];
  const iface = subgraphDoc?.interface ?? emptyGroupInterface();

  const title = useMemo(() => {
    const fromData = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
    const fromSub = typeof subgraphDoc?.graphTitle === "string" ? subgraphDoc.graphTitle.trim() : "";
    return fromData || fromSub || "Node Group";
  }, [data.graphTitle, subgraphDoc?.graphTitle]);

  const isInsideGroup = activeGraphId === subgraphId;
  const enterDisabled = isInsideGroup;
  const linkedHostCount = useMemo(
    () => countStudioSubgraphHosts(subgraphId, rootNodes, subgraphs),
    [subgraphId, rootNodes, subgraphs],
  );
  const isLinkedInstance = linkedHostCount > 1;

  const applyInterface = useCallback(
    (next: StudioGroupInterface) => {
      updateNodeGroupInterface(hostNodeId, next);
    },
    [hostNodeId, updateNodeGroupInterface],
  );

  const addSocket = useCallback(
    (direction: "input" | "output") => {
      const socket = createManualGroupSocket(direction);
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: [...iface.inputs, socket] }
          : { ...iface, outputs: [...iface.outputs, socket] };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  const removeSocket = useCallback(
    (direction: "input" | "output", id: string) => {
      const list = direction === "input" ? iface.inputs : iface.outputs;
      if (list.length <= 1) {
        return;
      }
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: iface.inputs.filter((s) => s.id !== id) }
          : { ...iface, outputs: iface.outputs.filter((s) => s.id !== id) };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  const reorderSockets = useCallback(
    (direction: "input" | "output", reordered: StudioGroupInterface["inputs"]) => {
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: reordered }
          : { ...iface, outputs: reordered };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  const patchSocket = useCallback(
    (
      direction: "input" | "output",
      id: string,
      patch: Partial<Pick<StudioGroupInterface["inputs"][number], "label" | "portType">>,
    ) => {
      const list = direction === "input" ? iface.inputs : iface.outputs;
      const nextList = list.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: nextList }
          : { ...iface, outputs: nextList };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-hide">
      {focusedBoundaryRole != null ? (
        <TRNHintText className="text-[11px]">
          Boundary node selected — edit the group interface below. Wires on removed sockets are
          dropped automatically.
        </TRNHintText>
      ) : isLinkedInstance ? (
        <TRNHintText className="text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Link2 className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
            Linked instance — {linkedHostCount} shells share this inner graph. Edits apply to all
            linked copies.
          </span>
        </TRNHintText>
      ) : (
        <TRNHintText className="text-[11px]">
          Typed inputs and outputs appear on the group shell in the parent graph. Drag to reorder
          sockets.
        </TRNHintText>
      )}

      <TRNFormField label="Group title" id={`node-group-title-${hostNodeId}`} className="space-y-1.5">
        <TRNInlineEdit
          value={title}
          onCommit={(next) => {
            updateNodeGroupTitle(hostNodeId, next.trim());
          }}
        />
      </TRNFormField>

      <div className="flex flex-col gap-2">
        <TRNButton
          type="button"
          className="w-full justify-center"
          disabled={enterDisabled}
          prefixIcon={<FolderOpen className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            enterGroup(subgraphId);
          }}
        >
          Enter group
        </TRNButton>
        <TRNButton
          type="button"
          className="w-full justify-center"
          prefixIcon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            duplicateGroupLinked(hostNodeId);
          }}
        >
          Duplicate linked
        </TRNButton>
        <TRNButton
          type="button"
          className="w-full justify-center"
          prefixIcon={<Copy className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            duplicateGroupDeepCopy(hostNodeId);
          }}
        >
          Duplicate deep copy
        </TRNButton>
        <TRNButton
          type="button"
          className="w-full justify-center"
          prefixIcon={<Ungroup className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            ungroupNodeGroup(hostNodeId);
          }}
        >
          Ungroup (Ctrl+Shift+G)
        </TRNButton>
      </div>

      <InspectorCollapsibleSection
        title="Inputs"
        icon={<LogIn size={14} aria-hidden />}
        iconHint="Sockets on the left of the group shell — wires from the parent graph connect here."
        badge={
          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-300">
            {iface.inputs.length}
          </span>
        }
        defaultExpanded={focusedBoundaryRole !== "output"}
      >
        <div className="flex justify-end">
          <TRNButton
            type="button"
            size="compact"
            prefixIcon={<Plus className="h-3 w-3" aria-hidden />}
            onClick={() => {
              addSocket("input");
            }}
          >
            Add input
          </TRNButton>
        </div>
        <GroupSocketSortableList
          sockets={iface.inputs}
          onRemove={(id) => {
            removeSocket("input", id);
          }}
          onPatch={(id, patch) => {
            patchSocket("input", id, patch);
          }}
          onReorder={(next) => {
            reorderSockets("input", next);
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Outputs"
        icon={<LogOut size={14} aria-hidden />}
        iconHint="Sockets on the right of the group shell — wires to the parent graph leave here."
        badge={
          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-300">
            {iface.outputs.length}
          </span>
        }
        defaultExpanded={focusedBoundaryRole !== "input"}
      >
        <div className="flex justify-end">
          <TRNButton
            type="button"
            size="compact"
            prefixIcon={<Plus className="h-3 w-3" aria-hidden />}
            onClick={() => {
              addSocket("output");
            }}
          >
            Add output
          </TRNButton>
        </div>
        <GroupSocketSortableList
          sockets={iface.outputs}
          onRemove={(id) => {
            removeSocket("output", id);
          }}
          onPatch={(id, patch) => {
            patchSocket("output", id, patch);
          }}
          onReorder={(next) => {
            reorderSockets("output", next);
          }}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}

/** Resolve the host group node id from a group shell or boundary selection. */
export function resolveNodeGroupHostId(
  selectedNode: { id: string; type?: string; data?: unknown },
  rootNodes: readonly { id: string; type?: string; data?: unknown }[],
  activeGraphId: string,
): { hostNodeId: string; data: StudioNodeGroupData; focusedBoundaryRole: "input" | "output" | null } | null {
  if (isStudioNodeGroupNode(selectedNode as Parameters<typeof isStudioNodeGroupNode>[0])) {
    return {
      hostNodeId: selectedNode.id,
      data: selectedNode.data as StudioNodeGroupData,
      focusedBoundaryRole: null,
    };
  }
  if (
    isStudioGroupBoundaryNode(selectedNode as Parameters<typeof isStudioGroupBoundaryNode>[0]) &&
    activeGraphId !== STUDIO_ROOT_GRAPH_ID
  ) {
    const host = rootNodes.find(
      (n) =>
        isStudioNodeGroupNode(n as Parameters<typeof isStudioNodeGroupNode>[0]) &&
        ((n.data as StudioNodeGroupData).subgraphId ?? n.id) === activeGraphId,
    );
    if (host == null || !isStudioNodeGroupNode(host as Parameters<typeof isStudioNodeGroupNode>[0])) {
      return null;
    }
    const role =
      selectedNode.type === "studio-group-input"
        ? ("input" as const)
        : selectedNode.type === "studio-group-output"
          ? ("output" as const)
          : null;
    return {
      hostNodeId: host.id,
      data: host.data as StudioNodeGroupData,
      focusedBoundaryRole: role,
    };
  }
  return null;
}

export function nodeGroupInspectorTitle(data: StudioNodeGroupData, subgraphTitle?: string): string {
  const fromData = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
  const fromSub = typeof subgraphTitle === "string" ? subgraphTitle.trim() : "";
  return fromData || fromSub || "Node Group";
}
