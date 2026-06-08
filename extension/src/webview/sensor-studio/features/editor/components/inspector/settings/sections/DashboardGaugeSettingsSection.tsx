import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";
import { RadialGaugeSettingsSection } from "./RadialGaugeSettingsSection";

export function DashboardGaugeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  return (
    <>
      <div className="mb-2 flex justify-end">
        <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
      </div>
      <RadialGaugeSettingsSection {...props} />
      <DashboardPlacementPanel {...props} />
    </>
  );
}
