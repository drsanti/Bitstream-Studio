export type LogicGateOperation = "and" | "or" | "not" | "xor";

export const LOGIC_GATE_OPERATION_OPTIONS: ReadonlyArray<{ value: LogicGateOperation; label: string }> = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
  { value: "not", label: "NOT" },
  { value: "xor", label: "XOR" },
];

export function normalizeLogicGateOperation(op: string | undefined): LogicGateOperation {
  const found = LOGIC_GATE_OPERATION_OPTIONS.find((o) => o.value === op);
  return found?.value ?? "and";
}

export function isUnaryLogicGateOperation(op: string | undefined): boolean {
  return normalizeLogicGateOperation(op) === "not";
}

export function readLogicGateInput(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0.5;
  }
  return false;
}

export function evaluateLogicGateOperation(
  op: string | undefined,
  a: unknown,
  b: unknown,
): boolean {
  const operation = normalizeLogicGateOperation(op);
  const A = readLogicGateInput(a);
  const B = readLogicGateInput(b);
  switch (operation) {
    case "and":
      return A && B;
    case "or":
      return A || B;
    case "not":
      return !A;
    case "xor":
      return A !== B;
    default:
      return A && B;
  }
}
