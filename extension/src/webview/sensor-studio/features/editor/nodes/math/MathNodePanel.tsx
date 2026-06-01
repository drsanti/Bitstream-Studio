import { TRNSelect } from "../../../../../ui/TRN";
import {
  MATH_OPERATION_OPTIONS,
  normalizeMathOperation,
  type MathOperation,
} from "../../../../core/flow/math-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

export type MathNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function MathNodePanel(props: MathNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const operation = normalizeMathOperation(
    typeof defaultConfig.operation === "string" ? defaultConfig.operation : undefined,
  );

  return (
    <ReadingPanel className="nodrag nopan space-y-1.5">
      <TRNSelect
        ariaLabel="Math operation"
        value={operation}
        options={MATH_OPERATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        triggerClassName="w-full"
        onValueChange={(next) => {
          updateField(nodeId, "operation", next as MathOperation);
        }}
      />
    </ReadingPanel>
  );
}
