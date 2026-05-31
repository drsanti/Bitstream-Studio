import { ToggleLeft } from "lucide-react";
import { TRNFormField, TRNHintText, TRNToggleSwitch } from "../../../../../../../ui/TRN";
import { readEventBooleanValue, readEventSetBooleanTarget } from "../../../../../../core/flow/flow-event-runner";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function EventSetBooleanSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const setTo = readEventSetBooleanTarget(dc);
  const output = readEventBooleanValue(dc);

  return (
    <InspectorCollapsibleSection
      title="Set boolean"
      icon={<ToggleLeft className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Each event pulse writes this ON/OFF value to the output wire (latched until the next pulse)."
      defaultExpanded
    >
      <TRNFormField label="Set output on trigger" id="event-set-boolean-set-to" className="space-y-1.5">
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-zinc-950/45 px-2.5 py-2">
          <span className="text-[11px] text-zinc-300">{setTo ? "ON (true)" : "OFF (false)"}</span>
          <TRNToggleSwitch
            checked={setTo}
            ariaLabel="Boolean value applied on each event pulse"
            onCheckedChange={(next) => {
              onUpdateConfigField("setTo", next);
            }}
          />
        </div>
      </TRNFormField>
      <TRNHintText className="text-[10px]">
        Current **out** wire: {output ? "ON" : "OFF"}. Manual toggle on the node card sets the latched
        output before the first pulse.
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
