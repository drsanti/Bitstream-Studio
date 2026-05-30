import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../../InspectorScrubNumberInput";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function SparklineSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Sparkline">
      <InspectorPropertyRow label="History size" description="Number of samples kept for the mini plot.">
        <InspectorScrubNumberInput
          aria-label="Sparkline history size"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.historySize ?? 24)}
          min={4}
          max={512}
          step={1}
          onCommit={(next) => {
            onUpdateConfigField("historySize", Math.round(next));
          }}
        />
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
