import {
  COMPARE_OPERATION_OPTIONS,
  type CompareOperation,
} from "../../../../core/flow/compare-operations";

/** Compact glyph for canvas / header (not the long dropdown label). */
export function compareOperationGlyph(op: CompareOperation): string {
  switch (op) {
    case ">=":
      return "≥";
    case "<=":
      return "≤";
    case "==":
      return "==";
    case "!=":
      return "≠";
    default:
      return op;
  }
}

export function compareOperationLabel(op: CompareOperation): string {
  return (
    COMPARE_OPERATION_OPTIONS.find((o) => o.value === op)?.label ??
    compareOperationGlyph(op)
  );
}

export const COMPARE_OPERATION_PICKER_ORDER: readonly CompareOperation[] = [
  ">",
  "<",
  ">=",
  "<=",
  "==",
  "!=",
];
