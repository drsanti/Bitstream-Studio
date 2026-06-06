import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { InspectorScopeThisNodeChip } from "./InspectorScopeChip";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorNodeLayoutSizeFields } from "./InspectorNodeLayoutSizeFields";
import { InspectorViewportPreviewLayoutFields } from "./InspectorViewportPreviewLayoutFields";
import { InspectorSection } from "./InspectorSection";
import type { StudioNode } from "../../store/flow-editor.store";
import { isScene3dInspectorNodeId } from "../../nodes/scene3d/scene3d-inspector-node-ids";
import {
  isSocketValuesVisible,
  isSocketsExpanded,
  studioNodeHasHideableBody,
  studioNodeSupportsSocketCollapse,
} from "../../nodes/flow-node/socket-display";
import { readStudioFlowNodeLayoutSize } from "../../nodes/flow-node/studio-node-layout-size";
import { studioNodeAllowsBodyCollapse } from "../../nodes/flow-node/studio-body-collapse";

export type NodeInspectorCanvasLayoutSectionProps = {
  selectedNode: StudioNode;
  onAllowBodyCollapseChange: (next: boolean) => void;
};

export function NodeInspectorCanvasLayoutSection(
  props: NodeInspectorCanvasLayoutSectionProps,
) {
  const { selectedNode, onAllowBodyCollapseChange } = props;
  const hasBodyPanel = studioNodeHasHideableBody(selectedNode.data);
  const allowBodyCollapse = studioNodeAllowsBodyCollapse(selectedNode.data);
  const nodeResizable = useFlowEditorStore(
    (s) =>
      s.nodes.find((n) => n.id === selectedNode.id)?.data.ui?.resizable === true,
  );
  const showViewportPreviewPresets = isScene3dInspectorNodeId(
    selectedNode.data.nodeId,
  );

  const edges = useFlowEditorStore((s) => s.edges);
  const setSocketValuesVisibleForNodes = useFlowEditorStore(
    (s) => s.setSocketValuesVisibleForNodes,
  );
  const setSocketsExpandedForNodes = useFlowEditorStore(
    (s) => s.setSocketsExpandedForNodes,
  );
  const updateSelectedNodeUiResizable = useFlowEditorStore(
    (s) => s.updateSelectedNodeUiResizable,
  );
  const updateSelectedStudioNodeLayoutDimensions = useFlowEditorStore(
    (s) => s.updateSelectedStudioNodeLayoutDimensions,
  );

  const socketValuesVisible = isSocketValuesVisible(selectedNode.data.ui);
  const socketsExpanded = isSocketsExpanded(selectedNode.data.ui);
  const socketCollapseDisabled = !studioNodeSupportsSocketCollapse(
    selectedNode,
    edges,
  );

  const nodeIds = useMemo(() => [selectedNode.id], [selectedNode.id]);
  const layoutSize = useMemo(
    () => readStudioFlowNodeLayoutSize(selectedNode),
    [selectedNode],
  );

  return (
    <div className="space-y-2">
      <p className="px-0.5 text-[10px] leading-snug text-zinc-500">
        Card layout on the flow graph. Grid and graph-wide wire style → deselect
        all nodes (Flow canvas inspector).
      </p>

      <InspectorSection
        title="Socket rows"
        hint="Ports and live readouts on this node's header strip."
        variant="compact"
        headerTrailing={<InspectorScopeThisNodeChip />}
      >
        <InspectorCompactToggleRow
          label="Live values beside ports"
          hint="Show numbers and badges next to each port on this card (Shift+V when selected)."
          checked={socketValuesVisible}
          onCheckedChange={(next) =>
            setSocketValuesVisibleForNodes(nodeIds, next)
          }
          ariaLabel="Live values beside ports"
        />
        <InspectorCompactToggleRow
          label="Unwired ports visible"
          hint={
            socketCollapseDisabled
              ? "This node has only one port or every port is wired — nothing to hide."
              : "When off, only ports that have a wire stay visible (Shift+H when selected)."
          }
          checked={socketsExpanded}
          disabled={socketCollapseDisabled}
          onCheckedChange={(next) => setSocketsExpandedForNodes(nodeIds, next)}
          ariaLabel="Unwired ports visible"
        />
      </InspectorSection>

      {hasBodyPanel ? (
        <InspectorSection
          title="Body panel"
          hint="The panel under the header — chart, knob, preview, and similar controls."
          variant="compact"
          headerTrailing={<InspectorScopeThisNodeChip />}
        >
          <InspectorCompactToggleRow
            label="Allow hiding body panel"
            hint="When enabled, collapse the body with the selection toolbar Panel button or Shift+B."
            checked={allowBodyCollapse}
            onCheckedChange={onAllowBodyCollapseChange}
            ariaLabel="Allow hiding body panel"
          />
        </InspectorSection>
      ) : null}

      <InspectorSection
        title="Card size"
        hint="Width and height of this node's card on the flow graph."
        variant="compact"
        headerTrailing={<InspectorScopeThisNodeChip />}
      >
        <InspectorCompactToggleRow
          label="Manual resize"
          hint="Drag this card's edges or corners while selected. Off = auto-fit from content. Shift+R reset size · Shift+W re-measure width."
          checked={nodeResizable}
          onCheckedChange={(next) => updateSelectedNodeUiResizable(next)}
          ariaLabel="Manual resize on flow canvas"
        />
        {showViewportPreviewPresets ? (
          <InspectorViewportPreviewLayoutFields selectedNode={selectedNode} />
        ) : null}
        {nodeResizable ? (
          <InspectorNodeLayoutSizeFields
            nodeId={selectedNode.id}
            width={layoutSize.width}
            height={layoutSize.height}
            onCommit={(patch) =>
              updateSelectedStudioNodeLayoutDimensions(patch)
            }
          />
        ) : null}
      </InspectorSection>
    </div>
  );
}
