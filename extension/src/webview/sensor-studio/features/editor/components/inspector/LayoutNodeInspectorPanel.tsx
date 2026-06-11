import type { FlowGraphNode } from "../../store/flow-editor.store";
import { isStudioFlowNode } from "../../layout/layout-port-resolution";
import { LAYOUT_MENU_ENTRIES } from "../../layout/layout-flow-menu-entries";
import type {
  FrameLayoutNodeData,
  NoteLayoutNodeData,
} from "../../layout/layout-flow-nodes.types";
import { FrameLayoutInspectorSection } from "./FrameLayoutInspectorSection";
import { NoteLayoutInspectorSection } from "./NoteLayoutInspectorSection";
import { resolveNodeGroupHostId } from "../../subgraphs/resolve-node-group-host";
import { NodeGroupInspectorSection } from "./NodeGroupInspectorSection";
import { TRN_INSPECTOR_PANEL_SHELL_CLASS } from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";

type LayoutNodeInspectorPanelProps = {
  borderColor?: string;
  panelColor?: string;
  selectedNode: FlowGraphNode;
};

const LAYOUT_INSPECTOR_PANEL_CLASS = TRN_INSPECTOR_PANEL_SHELL_CLASS;

export function LayoutNodeInspectorPanel(props: LayoutNodeInspectorPanelProps) {
  const { selectedNode } = props;
  const rootNodes = useFlowEditorStore((s) => s.rootNodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);

  if (isStudioFlowNode(selectedNode)) {
    return null;
  }

  const groupHost = resolveNodeGroupHostId(
    selectedNode,
    rootNodes,
    activeGraphId,
    subgraphs,
  );

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

  if (groupHost != null) {
    return (
      <div className={LAYOUT_INSPECTOR_PANEL_CLASS}>
        <NodeGroupInspectorSection
          hostNodeId={groupHost.hostNodeId}
          data={groupHost.data}
          focusedBoundaryRole={groupHost.focusedBoundaryRole}
        />
      </div>
    );
  }

  return (
    <div className={LAYOUT_INSPECTOR_PANEL_CLASS}>
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 pt-2 text-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-100">{meta?.title ?? "Layout"}</h2>
        {selectedNode.type === "studio-frame" ? (
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
                Shortcut: press <kbd className="rounded bg-zinc-800 px-1 py-0.5">R</kbd> at the
                pointer to spawn another reroute. Shift+click a wire to insert on an edge.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
