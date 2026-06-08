import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";
import { NumericDisplaySettingsSection } from "./NumericDisplaySettingsSection";

export function DashboardTextSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  return (
    <>
      <div className="mb-2 flex justify-end">
        <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
      </div>
      <NumericDisplaySettingsSection {...props} />
      <DashboardPlacementPanel {...props} />
    </>
  );
}
