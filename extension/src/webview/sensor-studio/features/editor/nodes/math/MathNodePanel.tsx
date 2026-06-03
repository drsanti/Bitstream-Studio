import { TRNSelect } from "../../../../../ui/TRN";
import {
  MATH_OPERATION_OPTIONS,
  normalizeMathOperation,
  type MathOperation,
} from "../../../../core/flow/math-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { mathOperationSelectOptions } from "./math-operation-select-ui";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import { widestTrnSelectOptionLabel } from "../flow-node/flow-node-intrinsic-width-utils";
import { FLOW_NODE_TRN_SELECT_CLASS } from "../flow-node/flow-node-trn-select-layout";

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

  const opOptions = mathOperationSelectOptions(MATH_OPERATION_OPTIONS);
  const selectedLabel =
    opOptions.find((o) => o.value === operation)?.label ?? operation;

  return (
    <div className="nodrag nopan relative mt-2 min-w-0 w-full max-w-full overflow-hidden">
      <FlowNodeIntrinsicWidthMarker
        labels={[selectedLabel, widestTrnSelectOptionLabel(opOptions)]}
      />
      <TRNSelect
        className={FLOW_NODE_TRN_SELECT_CLASS}
        ariaLabel="Math operation"
        value={operation}
        options={opOptions}
        triggerClassName="w-full min-w-0 max-w-full"
        onValueChange={(next) => {
          updateField(nodeId, "operation", next as MathOperation);
        }}
      />
    </div>
  );
}
