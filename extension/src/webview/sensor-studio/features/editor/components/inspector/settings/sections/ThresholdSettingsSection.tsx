import { InspectorSelectRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function ThresholdSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Threshold">
      <InspectorSelectRow
        label="Operator"
        ariaLabel="Threshold operator"
        value={String(selectedNode.data.defaultConfig.operator ?? ">")}
        options={[
          { value: ">", label: ">" },
          { value: "<", label: "<" },
        ]}
        onChange={(next) => {
          onUpdateConfigField("operator", next);
        }}
      />
      <InspectorNumericScrubRow
        label="Value"
        description="Compared against the incoming number."
        ariaLabel="Threshold compare value"
        value={Number(selectedNode.data.defaultConfig.value ?? 0.5)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("value", next);
        }}
      />
    </InspectorSettingsSectionFrame>
  );
}
