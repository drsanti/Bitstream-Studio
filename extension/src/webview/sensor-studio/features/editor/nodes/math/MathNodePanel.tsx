import { TRNSelect } from "../../../../../ui/TRN";
import {
  MATH_OPERATION_OPTIONS,
  normalizeMathOperation,
  type MathOperation,
} from "../../../../core/flow/math-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { mathOperationSelectOptions } from "./math-operation-select-ui";

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
    <TRNSelect
      className="nodrag nopan mt-2 min-w-0 w-full max-w-full"
      ariaLabel="Math operation"
      value={operation}
      options={mathOperationSelectOptions(MATH_OPERATION_OPTIONS)}
      triggerClassName="w-full"
      onValueChange={(next) => {
        updateField(nodeId, "operation", next as MathOperation);
      }}
    />
  );
}
