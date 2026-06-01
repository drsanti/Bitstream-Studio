export type CompareOperation = ">" | "<" | ">=" | "<=" | "==" | "!=";

export const COMPARE_OPERATION_OPTIONS: ReadonlyArray<{ value: CompareOperation; label: string }> = [
  { value: ">", label: "Greater than (>)" },
  { value: "<", label: "Less than (<)" },
  { value: ">=", label: "Greater or equal (≥)" },
  { value: "<=", label: "Less or equal (≤)" },
  { value: "==", label: "Equal (==)" },
  { value: "!=", label: "Not equal (!=)" },
];

export function normalizeCompareOperation(op: string | undefined): CompareOperation {
  const found = COMPARE_OPERATION_OPTIONS.find((o) => o.value === op);
  return found?.value ?? ">";
}

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Compare two numbers; unwired callers should pass 0 for missing pins. */
export function evaluateCompareOperation(
  op: string | undefined,
  a: number,
  b: number,
): boolean {
  const operation = normalizeCompareOperation(op);
  const A = finiteOrZero(a);
  const B = finiteOrZero(b);
  switch (operation) {
    case ">":
      return A > B;
    case "<":
      return A < B;
    case ">=":
      return A >= B;
    case "<=":
      return A <= B;
    case "==":
      return A === B;
    case "!=":
      return A !== B;
    default:
      return A > B;
  }
}
