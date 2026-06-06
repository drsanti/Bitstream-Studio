import { PlotterInspectorSection } from "../../../PlotterInspectorSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-registry";

export function PlotterSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  return <PlotterInspectorSection selectedNode={selectedNode} />;
}
