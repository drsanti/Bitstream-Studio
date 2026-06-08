import { PlotterInspectorSection } from "../../../PlotterInspectorSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPublishSettingsSection } from "./DashboardPublishSettingsSection";

export function PlotterSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  return (
    <>
      <PlotterInspectorSection selectedNode={selectedNode} />
      <DashboardPublishSettingsSection {...props} />
    </>
  );
}
