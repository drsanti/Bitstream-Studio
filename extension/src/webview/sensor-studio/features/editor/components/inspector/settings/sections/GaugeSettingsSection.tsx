import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../../InspectorScrubNumberInput";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function GaugeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Gauge">
      <InspectorPropertyRow label="Unit" description="Suffix shown next to the live value (optional).">
        <input
          type="text"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={String(selectedNode.data.defaultConfig.unit ?? "")}
          placeholder="e.g. °C"
          onChange={(event) =>
            onUpdateConfigField("unit", event.target.value)
          }
        />
      </InspectorPropertyRow>
      <InspectorPropertyRow label="Decimals">
        <InspectorScrubNumberInput
          aria-label="Gauge decimal places"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.decimals ?? 3)}
          min={0}
          max={6}
          step={1}
          onCommit={(next) => {
            onUpdateConfigField("decimals", Math.round(next));
          }}
        />
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
