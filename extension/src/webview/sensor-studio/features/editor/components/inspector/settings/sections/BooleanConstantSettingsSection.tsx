import { TRNToggleSwitch } from "../../../../../../../ui/TRN";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function BooleanConstantSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const raw = selectedNode.data.defaultConfig.value;
  const value = typeof raw === "boolean" ? raw : false;

  return (
    <InspectorSettingsSectionFrame title="Boolean">
      <InspectorPropertyRow
        label="Output value"
        description="Drives the out boolean wire. Editable on the node card or in this inspector."
      >
        <div className="flex justify-end pt-0.5">
          <TRNToggleSwitch
            checked={value}
            ariaLabel="Boolean constant output"
            onCheckedChange={(checked) => {
              onUpdateConfigField("value", checked);
            }}
          />
        </div>
      </InspectorPropertyRow>
    </InspectorSettingsSectionFrame>
  );
}
