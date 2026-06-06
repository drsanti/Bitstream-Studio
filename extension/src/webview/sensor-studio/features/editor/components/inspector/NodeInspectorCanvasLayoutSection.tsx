import { useMemo } from "react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorSection } from "./InspectorSection";
import type { StudioNode } from "../../store/flow-editor.store";
import {
  isSocketValuesVisible,
  isSocketsExpanded,
  studioNodeHasHideableBody,
  studioNodeSupportsSocketCollapse,
} from "../../nodes/flow-node/socket-display";
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

  const edges = useFlowEditorStore((s) => s.edges);
  const setSocketValuesVisibleForNodes = useFlowEditorStore(
    (s) => s.setSocketValuesVisibleForNodes,
  );
  const setSocketsExpandedForNodes = useFlowEditorStore(
    (s) => s.setSocketsExpandedForNodes,
  );

  const socketValuesVisible = isSocketValuesVisible(selectedNode.data.ui);
  const socketsExpanded = isSocketsExpanded(selectedNode.data.ui);
  const socketCollapseDisabled = !studioNodeSupportsSocketCollapse(
    selectedNode,
    edges,
  );

  const nodeIds = useMemo(() => [selectedNode.id], [selectedNode.id]);

  return (
    <InspectorSection
      title="Canvas"
      variant="compact"
      contentClassName="space-y-2 px-2 py-1.5"
      hint="Width and height auto-fit when socket display or body visibility changes."
    >
      <div className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Socket display
        </div>
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
      </div>

      {hasBodyPanel ? (
        <div className="space-y-2 border-t border-zinc-800/60 pt-2">
          <InspectorCompactToggleRow
            label="Allow collapsing node body"
            hint="When enabled, hide the body with the selection toolbar Panel button or Shift+B."
            checked={allowBodyCollapse}
            onCheckedChange={onAllowBodyCollapseChange}
            ariaLabel="Allow collapsing node body"
          />
        </div>
      ) : null}
    </InspectorSection>
  );
}
