import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../../InspectorScrubNumberInput";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function ClampSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Clamp">
      <InspectorPropertyRow label="Min">
        <InspectorScrubNumberInput
          aria-label="Clamp minimum"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.min ?? -1)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("min", next);
          }}
        />
      </InspectorPropertyRow>
      <InspectorPropertyRow label="Max">
        <InspectorScrubNumberInput
          aria-label="Clamp maximum"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.max ?? 1)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("max", next);
          }}
        />
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
