import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../../InspectorScrubNumberInput";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function ThresholdSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  return (
    <InspectorSettingsSectionFrame title="Threshold">
      <InspectorPropertyRow label="Operator">
        <select
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={String(selectedNode.data.defaultConfig.operator ?? ">")}
          onChange={(event) =>
            onUpdateConfigField("operator", event.target.value)
          }
        >
          <option value=">">{">"}</option>
          <option value="<">{"<"}</option>
        </select>
      </InspectorPropertyRow>
      <InspectorPropertyRow label="Value" description="Compared against the incoming number.">
        <InspectorScrubNumberInput
          aria-label="Threshold compare value"
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={Number(selectedNode.data.defaultConfig.value ?? 0.5)}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("value", next);
          }}
        />
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
