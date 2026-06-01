import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorSection } from "./InspectorSection";
import {
  isStudioSensorSocketPreviewNodeId,
  type StudioNode,
} from "../../store/flow-editor.store";
import { studioNodeHasHideableBody } from "../../nodes/flow-node/socket-display";
import { studioNodeAllowsBodyCollapse } from "../../nodes/flow-node/studio-body-collapse";

export type NodeInspectorCanvasLayoutSectionProps = {
  selectedNode: StudioNode;
  onResizableChange: (next: boolean) => void;
  onAllowBodyCollapseChange: (next: boolean) => void;
};

export function NodeInspectorCanvasLayoutSection(
  props: NodeInspectorCanvasLayoutSectionProps,
) {
  const { selectedNode, onResizableChange, onAllowBodyCollapseChange } = props;
  const resizable = selectedNode.data.ui?.resizable === true;
  const autoHeightHint = isStudioSensorSocketPreviewNodeId(selectedNode.data.nodeId);
  const hasBodyPanel = studioNodeHasHideableBody(selectedNode.data);
  const allowBodyCollapse = studioNodeAllowsBodyCollapse(selectedNode.data);

  return (
    <InspectorSection
      title="Canvas"
      variant="compact"
      contentClassName="space-y-2 px-2 py-1.5"
      hint={
        autoHeightHint
          ? "Height usually follows socket content until you resize vertically."
          : undefined
      }
    >
      <InspectorCompactToggleRow
        label="Allow resize on canvas"
        hint="Saved in this flow · drag edges when the node is selected."
        checked={resizable}
        onCheckedChange={onResizableChange}
        ariaLabel="Allow resize on canvas"
      />
      {hasBodyPanel ? (
        <InspectorCompactToggleRow
          label="Allow collapsing node body"
          hint="When enabled, hide the body with the selection toolbar Panel button or Shift+B."
          checked={allowBodyCollapse}
          onCheckedChange={onAllowBodyCollapseChange}
          ariaLabel="Allow collapsing node body"
        />
      ) : null}
    </InspectorSection>
  );
}
