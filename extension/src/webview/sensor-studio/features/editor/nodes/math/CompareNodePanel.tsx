import { TRNSelect } from "../../../../../ui/TRN";
import {
  COMPARE_OPERATION_OPTIONS,
  normalizeCompareOperation,
  type CompareOperation,
} from "../../../../core/flow/compare-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

export type CompareNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function CompareNodePanel(props: CompareNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const operation = normalizeCompareOperation(
    typeof defaultConfig.operation === "string" ? defaultConfig.operation : undefined,
  );

  return (
    <ReadingPanel className="nodrag nopan space-y-1.5">
      <TRNSelect
        ariaLabel="Compare operation"
        value={operation}
        options={COMPARE_OPERATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        triggerClassName="w-full"
        onValueChange={(next) => {
          updateField(nodeId, "operation", next as CompareOperation);
        }}
      />
    </ReadingPanel>
  );
}
