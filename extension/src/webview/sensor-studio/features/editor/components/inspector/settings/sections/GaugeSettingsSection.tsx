import { InspectorNumericScrubRow, InspectorTextRow } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function GaugeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Gauge">
      <InspectorTextRow
        label="Unit"
        description="Suffix shown next to the live value (optional)."
        ariaLabel="Gauge unit"
        value={String(selectedNode.data.defaultConfig.unit ?? "")}
        placeholder="e.g. °C"
        onChange={(next) => {
          onUpdateConfigField("unit", next);
        }}
      />
      <InspectorNumericScrubRow
        label="Decimals"
        ariaLabel="Gauge decimal places"
        value={Number(selectedNode.data.defaultConfig.decimals ?? 3)}
        min={0}
        max={6}
        step={1}
        fractionDigits={0}
        onCommit={(next) => {
          onUpdateConfigField("decimals", Math.round(next));
        }}
      />
    </InspectorSettingsSectionFrame>
  );
}
