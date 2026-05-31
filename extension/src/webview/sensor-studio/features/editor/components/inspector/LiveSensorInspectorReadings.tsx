import { InspectorSensorDeckReadings } from "./InspectorSensorDeckReadings";
import {
  isStudioLiveInspectorReadingsNodeId,
  type StudioNode,
} from "../../store/flow-editor.store";

export type LiveSensorInspectorReadingsProps = {
  selectedNode: StudioNode;
};

/**
 * Live readings for hardware sensor nodes — delegates to Telemetry Data deck viewers
 * (`InspectorSensorDeckReadings`) for parity with the right-panel deck.
 */
export function LiveSensorInspectorReadings(props: LiveSensorInspectorReadingsProps) {
  const { selectedNode } = props;

  if (!isStudioLiveInspectorReadingsNodeId(selectedNode.data.nodeId)) {
    return null;
  }

  return <InspectorSensorDeckReadings selectedNode={selectedNode} />;
}
