import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { InspectorCanvasSubsection } from "./InspectorCanvasSubsection";
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
  const nodeResizable = selectedNode.data.ui?.resizable === true;
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
    <InspectorSection
      title="Canvas"
      variant="compact"
      contentClassName="space-y-2 px-2 py-1.5"
      hint="Socket display auto-fits width. Enable manual resize for viewport and output nodes."
    >
      <InspectorCanvasSubsection title="Socket display">
        <InspectorCompactToggleRow
          label="Show socket live values"
          hint="Live readouts beside each port (Shift+V on canvas selection)."
          checked={socketValuesVisible}
          onCheckedChange={(next) =>
            setSocketValuesVisibleForNodes(nodeIds, next)
          }
          ariaLabel="Show socket live values"
        />
        <InspectorCompactToggleRow
          label="Show unwired sockets"
          hint={
            socketCollapseDisabled
              ? "This node has only one socket or every socket is wired — nothing to collapse."
              : "When off, only wired socket rows stay visible (Shift+H on canvas selection)."
          }
          checked={socketsExpanded}
          disabled={socketCollapseDisabled}
          onCheckedChange={(next) => setSocketsExpandedForNodes(nodeIds, next)}
          ariaLabel="Show unwired sockets"
        />
      </InspectorCanvasSubsection>

      {hasBodyPanel ? (
        <InspectorCanvasSubsection title="Node body" separated>
          <InspectorCompactToggleRow
            label="Allow collapsing node body"
            hint="When enabled, hide the body with the selection toolbar Panel button or Shift+B."
            checked={allowBodyCollapse}
            onCheckedChange={onAllowBodyCollapseChange}
            ariaLabel="Allow collapsing node body"
          />
        </InspectorCanvasSubsection>
      ) : null}

      <InspectorCanvasSubsection title="Canvas size" separated>
        <InspectorCompactToggleRow
          label="Allow manual resize on canvas"
          hint="When on, drag edges or corners while the node is selected. Shift+R reset size · Shift+W re-measure width."
          checked={nodeResizable}
          onCheckedChange={(next) => updateSelectedNodeUiResizable(next)}
          ariaLabel="Allow manual resize on canvas"
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
      </InspectorCanvasSubsection>
    </InspectorSection>
  );
}
