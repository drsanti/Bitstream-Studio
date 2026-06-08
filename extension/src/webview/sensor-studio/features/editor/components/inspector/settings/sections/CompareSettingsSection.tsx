import { GitCompare } from "lucide-react";
import { TRNFormField, TRNSelect } from "../../../../../../../ui/TRN";
import {
  COMPARE_OPERATION_OPTIONS,
  normalizeCompareOperation,
  type CompareOperation,
} from "../../../../../../core/flow/compare-operations";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPublishSettingsSection } from "./DashboardPublishSettingsSection";
import { DashboardStatusLabelFields } from "./DashboardStatusLabelFields";

export function CompareSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig;
  const operation = normalizeCompareOperation(
    typeof cfg.operation === "string" ? cfg.operation : undefined,
  );

  return (
    <>
    <InspectorCollapsibleSection
      title="Compare"
      icon={<GitCompare className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Compares wired A and B. Unwired inputs count as 0. Output is a boolean on Out."
      defaultExpanded
    >
      <TRNFormField label="Operation" id="compare-operation" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Compare operation"
          value={operation}
          options={COMPARE_OPERATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          triggerClassName="w-full"
          onValueChange={(next) => {
            onUpdateConfigField("operation", next as CompareOperation);
          }}
        />
      </TRNFormField>
      <div className="mt-3 border-t border-zinc-800/80 pt-3">
        <DashboardStatusLabelFields {...props} />
      </div>
    </InspectorCollapsibleSection>
    <DashboardPublishSettingsSection {...props} />
    </>
  );
}
