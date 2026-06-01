import { ToggleLeft } from "lucide-react";
import { TRNFormField, TRNSelect } from "../../../../../../../ui/TRN";
import {
  LOGIC_GATE_OPERATION_OPTIONS,
  normalizeLogicGateOperation,
  type LogicGateOperation,
} from "../../../../../../core/flow/logic-gate-operations";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function LogicGateSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig;
  const operation = normalizeLogicGateOperation(
    typeof cfg.operation === "string" ? cfg.operation : undefined,
  );

  return (
    <InspectorCollapsibleSection
      title="Logic gate"
      icon={<ToggleLeft className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Boolean inputs A and B (numbers > 0.5 count as true). NOT uses A only. Output is boolean on Out."
      defaultExpanded
    >
      <TRNFormField label="Operation" id="logic-gate-operation" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Logic gate operation"
          value={operation}
          options={LOGIC_GATE_OPERATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          triggerClassName="w-full"
          onValueChange={(next) => {
            onUpdateConfigField("operation", next as LogicGateOperation);
          }}
        />
      </TRNFormField>
    </InspectorCollapsibleSection>
  );
}
