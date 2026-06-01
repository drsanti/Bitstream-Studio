import type { StudioOutputHandleDef } from "../../features/editor/store/flow-editor.store";
import {
  isUnaryLogicGateOperation,
  normalizeLogicGateOperation,
} from "./logic-gate-operations";

const LOGIC_INPUT_A: StudioOutputHandleDef = { id: "a", portType: "boolean", label: "A" };
const LOGIC_INPUT_B: StudioOutputHandleDef = { id: "b", portType: "boolean", label: "B" };

export function computeLogicGateInputHandles(
  defaultConfig: Record<string, unknown>,
): StudioOutputHandleDef[] {
  const operation = normalizeLogicGateOperation(
    typeof defaultConfig.operation === "string" ? defaultConfig.operation : undefined,
  );
  return isUnaryLogicGateOperation(operation) ? [LOGIC_INPUT_A] : [LOGIC_INPUT_A, LOGIC_INPUT_B];
}

export const LOGIC_GATE_OUTPUT_HANDLE: StudioOutputHandleDef = {
  id: "out",
  portType: "boolean",
  label: "Out",
};
