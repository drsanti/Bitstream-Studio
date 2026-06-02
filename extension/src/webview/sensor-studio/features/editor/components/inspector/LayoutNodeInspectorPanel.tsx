import type { FlowGraphNode } from "../../store/flow-editor.store";
import { isStudioFlowNode } from "../../layout/layout-port-resolution";
import { LAYOUT_MENU_ENTRIES } from "../../layout/layout-flow-menu-entries";
import type {
  FrameLayoutNodeData,
  NoteLayoutNodeData,
} from "../../layout/layout-flow-nodes.types";
import { FrameLayoutInspectorSection } from "./FrameLayoutInspectorSection";
import { NoteLayoutInspectorSection } from "./NoteLayoutInspectorSection";
import {
  nodeGroupInspectorTitle,
  NodeGroupInspectorSection,
  resolveNodeGroupHostId,
} from "./NodeGroupInspectorSection";
import { useFlowEditorStore } from "../../store/flow-editor.store";

type LayoutNodeInspectorPanelProps = {
  borderColor: string;
  panelColor: string;
  selectedNode: FlowGraphNode;
};

export function LayoutNodeInspectorPanel(props: LayoutNodeInspectorPanelProps) {
  const { borderColor, panelColor, selectedNode } = props;
  const rootNodes = useFlowEditorStore((s) => s.rootNodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);

  if (isStudioFlowNode(selectedNode)) {
    return null;
  }

  const groupHost = resolveNodeGroupHostId(selectedNode, rootNodes, activeGraphId);

  const meta = LAYOUT_MENU_ENTRIES.find((entry) => {
    if (selectedNode.type === "studio-reroute") {
      return entry.id === "reroute";
    }
    if (selectedNode.type === "studio-split") {
      return entry.id === "split";
    }
    if (selectedNode.type === "studio-frame") {
      return entry.id === "frame";
    }
    if (selectedNode.type === "studio-note") {
      return entry.id === "note";
    }
    return false;
  });

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden p-4 text-zinc-200"
      style={{ backgroundColor: panelColor, borderColor }}
    >
      <h2 className="text-sm font-semibold text-zinc-100">
        {groupHost != null
          ? nodeGroupInspectorTitle(
              groupHost.data,
              subgraphs[groupHost.data.subgraphId ?? groupHost.hostNodeId]?.graphTitle,
            )
          : (meta?.title ?? "Layout")}
      </h2>
      {groupHost != null ? (
        <NodeGroupInspectorSection
          hostNodeId={groupHost.hostNodeId}
          data={groupHost.data}
          focusedBoundaryRole={groupHost.focusedBoundaryRole}
        />
      ) : selectedNode.type === "studio-frame" ? (
        <FrameLayoutInspectorSection
          frameNodeId={selectedNode.id}
          data={selectedNode.data as FrameLayoutNodeData}
        />
      ) : selectedNode.type === "studio-note" ? (
        <NoteLayoutInspectorSection
          noteNodeId={selectedNode.id}
          data={selectedNode.data as NoteLayoutNodeData}
        />
      ) : (
        <>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
            {meta?.description ?? "Canvas layout node — edit inline on the flow pane."}
          </p>
          {selectedNode.type === "studio-reroute" ? (
            <p className="mt-3 text-[11px] text-zinc-500">
              Shortcut: press <kbd className="rounded bg-zinc-800 px-1 py-0.5">R</kbd> at the pointer
              to spawn another reroute. Shift+click a wire to insert on an edge.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
