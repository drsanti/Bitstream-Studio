import { TRNSelect } from "../../../../../ui/TRN";
import {
  LOGIC_GATE_OPERATION_OPTIONS,
  normalizeLogicGateOperation,
  type LogicGateOperation,
} from "../../../../core/flow/logic-gate-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import { widestTrnSelectOptionLabel } from "../flow-node/flow-node-intrinsic-width-utils";
import { FLOW_NODE_TRN_SELECT_CLASS } from "../flow-node/flow-node-trn-select-layout";

export type LogicGateNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function LogicGateNodePanel(props: LogicGateNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const operation = normalizeLogicGateOperation(
    typeof defaultConfig.operation === "string" ? defaultConfig.operation : undefined,
  );

  const gateOptions = LOGIC_GATE_OPERATION_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const selectedLabel =
    gateOptions.find((o) => o.value === operation)?.label ?? operation;

  return (
    <ReadingPanel className="nodrag nopan relative space-y-1.5 overflow-hidden">
      <FlowNodeIntrinsicWidthMarker
        labels={[selectedLabel, widestTrnSelectOptionLabel(gateOptions)]}
      />
      <TRNSelect
        className={FLOW_NODE_TRN_SELECT_CLASS}
        ariaLabel="Logic gate operation"
        value={operation}
        options={gateOptions}
        triggerClassName="w-full min-w-0 max-w-full"
        onValueChange={(next) => {
          updateField(nodeId, "operation", next as LogicGateOperation);
        }}
      />
    </ReadingPanel>
  );
}
