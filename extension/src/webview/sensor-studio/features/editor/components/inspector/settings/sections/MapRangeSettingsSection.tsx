import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../../InspectorScrubNumberInput";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function MapRangeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Map range">
      <InspectorPropertyRow label="In min">
        <InspectorScrubNumberInput
          aria-label="Map range in min"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.inMin ?? 0)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("inMin", next);
          }}
        />
      </InspectorPropertyRow>
      <InspectorPropertyRow label="In max">
        <InspectorScrubNumberInput
          aria-label="Map range in max"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.inMax ?? 1)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("inMax", next);
          }}
        />
      </InspectorPropertyRow>
      <InspectorPropertyRow label="Out min">
        <InspectorScrubNumberInput
          aria-label="Map range out min"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.outMin ?? -1)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("outMin", next);
          }}
        />
      </InspectorPropertyRow>
      <InspectorPropertyRow label="Out max">
        <InspectorScrubNumberInput
          aria-label="Map range out max"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.outMax ?? 1)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("outMax", next);
          }}
        />
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
