import { TRNSelect } from "../../../../../ui/TRN";
import {
  LOGIC_GATE_OPERATION_OPTIONS,
  normalizeLogicGateOperation,
  type LogicGateOperation,
} from "../../../../core/flow/logic-gate-operations";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

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

  return (
    <ReadingPanel className="nodrag nopan space-y-1.5">
      <TRNSelect
        ariaLabel="Logic gate operation"
        value={operation}
        options={LOGIC_GATE_OPERATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        triggerClassName="w-full"
        onValueChange={(next) => {
          updateField(nodeId, "operation", next as LogicGateOperation);
        }}
      />
    </ReadingPanel>
  );
}
