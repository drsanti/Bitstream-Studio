import { Zap } from "lucide-react";
import { TRNFormField, TRNSelect } from "../../../../../../../ui/TRN";
import {
  MATH_OPERATION_OPTIONS,
  normalizeMathOperation,
  type MathOperation,
} from "../../../../../../core/flow/math-operations";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { mathOperationSelectOptions } from "../../../../nodes/math/math-operation-select-ui";

export function MathSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig;
  const operation = normalizeMathOperation(
    typeof cfg.operation === "string" ? cfg.operation : undefined,
  );

  return (
    <InspectorCollapsibleSection
      title="Math"
      icon={<Zap className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Binary ops use inputs A and B. Unary ops (sin, cos, abs, floor, ceil) use A only; B is ignored. Unwired inputs count as 0. sin/cos use radians."
      defaultExpanded
    >
      <TRNFormField label="Operation" id="math-operation" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Math operation"
          value={operation}
          options={mathOperationSelectOptions(MATH_OPERATION_OPTIONS)}
          triggerClassName="w-full"
          onValueChange={(next) => {
            onUpdateConfigField("operation", next as MathOperation);
          }}
        />
      </TRNFormField>
    </InspectorCollapsibleSection>
  );
}
