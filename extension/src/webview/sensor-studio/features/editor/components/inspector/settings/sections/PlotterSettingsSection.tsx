import { PlotterInspectorSection } from "../../../PlotterInspectorSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-registry";

export function PlotterSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { defaultConfig } = props;
  return (
    <PlotterInspectorSection
      defaultConfigRaw={defaultConfig as Record<string, unknown>}
    />
  );
}
