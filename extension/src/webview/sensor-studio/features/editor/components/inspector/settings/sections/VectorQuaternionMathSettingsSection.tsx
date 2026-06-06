import { Sigma } from "lucide-react";
import { TRNFormField, TRNSelect } from "../../../../../../../ui/TRN";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const VECTOR_ADD_OPS = [
  { value: "add", label: "Add" },
  { value: "sub", label: "Subtract" },
];

const COMPARE_OPS = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
];

export function VectorQuaternionMathSettingsSection(
  props: NodeInspectorSettingsSectionProps,
) {
  const { selectedNode, onUpdateConfigField } = props;
  const nodeId = selectedNode.data.nodeId;
  const cfg = selectedNode.data.defaultConfig;

  if (nodeId === "vector-add") {
    return (
      <InspectorCollapsibleSection
        title="Vector Add / Subtract"
        icon={<Sigma className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Add or subtract B from A."
        defaultExpanded
      >
        <TRNFormField label="Operation" id="vector-add-operation" className="space-y-1.5">
          <TRNSelect
            ariaLabel="Vector add or subtract"
            value={cfg.operation === "sub" ? "sub" : "add"}
            options={VECTOR_ADD_OPS}
            triggerClassName="w-full"
            onValueChange={(next) => {
              onUpdateConfigField("operation", next);
            }}
          />
        </TRNFormField>
      </InspectorCollapsibleSection>
    );
  }

  if (nodeId === "compare-vector-length") {
    return (
      <InspectorCollapsibleSection
        title="Compare Vector Length"
        icon={<Sigma className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Boolean compare on |Vector| vs Threshold."
        defaultExpanded
      >
        <TRNFormField label="Operator" id="compare-vector-length-op" className="space-y-1.5">
          <TRNSelect
            ariaLabel="Compare vector length operator"
            value={typeof cfg.operation === "string" ? cfg.operation : ">"}
            options={COMPARE_OPS}
            triggerClassName="w-full"
            onValueChange={(next) => {
              onUpdateConfigField("operation", next);
            }}
          />
        </TRNFormField>
      </InspectorCollapsibleSection>
    );
  }

  return null;
}
