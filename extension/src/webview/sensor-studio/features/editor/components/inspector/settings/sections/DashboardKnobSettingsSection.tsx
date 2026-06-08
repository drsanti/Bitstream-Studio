import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";
import { KnobSettingsSection } from "./KnobSettingsSection";

export function DashboardKnobSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  return (
    <>
      <div className="mb-2 flex justify-end">
        <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
      </div>
      <KnobSettingsSection {...props} />
      <DashboardPlacementPanel {...props} />
    </>
  );
}
