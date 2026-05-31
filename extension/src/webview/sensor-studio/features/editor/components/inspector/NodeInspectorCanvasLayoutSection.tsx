import { TRNHintText } from "../../../../../ui/TRN";
import { isStudioSensorSocketPreviewNodeId } from "../../store/flow-editor.store";
import type { StudioNode } from "../../store/flow-editor.store";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { InspectorSection } from "./InspectorSection";

export type NodeInspectorCanvasLayoutSectionProps = {
  selectedNode: StudioNode;
  onResizableChange: (next: boolean) => void;
};

export function NodeInspectorCanvasLayoutSection(
  props: NodeInspectorCanvasLayoutSectionProps,
) {
  const { selectedNode, onResizableChange } = props;
  const resizable = selectedNode.data.ui?.resizable === true;
  const autoHeightHint = isStudioSensorSocketPreviewNodeId(selectedNode.data.nodeId);

  return (
    <InspectorSection title="Canvas" contentClassName="space-y-1.5 px-2.5 py-2">
      <InspectorCompactToggleRow
        label="Allow resize on canvas"
        hint="Saved in this flow · drag edges and corners when the node is selected."
        checked={resizable}
        onCheckedChange={onResizableChange}
        ariaLabel="Allow resize on canvas"
      />
      {autoHeightHint ? (
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Height usually follows socket content until you resize vertically.
        </TRNHintText>
      ) : null}
    </InspectorSection>
  );
}
