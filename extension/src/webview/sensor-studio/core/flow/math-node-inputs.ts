import type { StudioOutputHandleDef } from "../../features/editor/store/flow-editor.store";
import { isUnaryMathOperation, normalizeMathOperation } from "./math-operations";

const MATH_INPUT_A: StudioOutputHandleDef = { id: "a", portType: "number", label: "A" };
const MATH_INPUT_B: StudioOutputHandleDef = { id: "b", portType: "number", label: "B" };

export function computeMathInputHandles(defaultConfig: Record<string, unknown>): StudioOutputHandleDef[] {
  const operation = normalizeMathOperation(
    typeof defaultConfig.operation === "string" ? defaultConfig.operation : undefined,
  );
  return isUnaryMathOperation(operation) ? [MATH_INPUT_A] : [MATH_INPUT_A, MATH_INPUT_B];
}

export const MATH_OUTPUT_HANDLE: StudioOutputHandleDef = {
  id: "out",
  portType: "number",
  label: "Out",
};
