import { DashboardPublishSettingsSection } from "./DashboardPublishSettingsSection";
import { DashboardStatusLabelFields } from "./DashboardStatusLabelFields";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function IndicatorDashboardSettingsSection(props: NodeInspectorSettingsSectionProps) {
  return (
    <>
      <DashboardStatusLabelFields {...props} />
      <DashboardPublishSettingsSection {...props} />
    </>
  );
}
