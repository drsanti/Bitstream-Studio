import { OscilloscopeInspectorSection } from "../../../OscilloscopeInspectorSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function OscilloscopeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  return (
    <OscilloscopeInspectorSection
      defaultConfigRaw={selectedNode.data.defaultConfig}
    />
  );
}
