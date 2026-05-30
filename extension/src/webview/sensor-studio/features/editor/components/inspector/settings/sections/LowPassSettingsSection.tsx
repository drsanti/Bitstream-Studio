import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../../InspectorScrubNumberInput";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function LowPassSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Low pass">
      <InspectorPropertyRow
        label="Alpha"
        description="0–1 smoothing coefficient (higher = follow input faster)."
      >
        <InspectorScrubNumberInput
          aria-label="Low pass alpha"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.alpha ?? 0.2)}
          min={0}
          max={1}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("alpha", next);
          }}
        />
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
