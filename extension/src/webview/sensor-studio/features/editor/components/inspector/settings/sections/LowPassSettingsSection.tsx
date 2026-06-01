import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function LowPassSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Low pass">
      <InspectorNumericScrubRow
        label="Alpha"
        description="0–1 smoothing coefficient (higher = follow input faster)."
        ariaLabel="Low pass alpha"
        value={Number(selectedNode.data.defaultConfig.alpha ?? 0.2)}
        min={0}
        max={1}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("alpha", next);
        }}
      />
    </InspectorSettingsSectionFrame>
  );
}
