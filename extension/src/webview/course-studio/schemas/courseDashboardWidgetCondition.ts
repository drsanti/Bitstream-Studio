import {
  COMPARE_OPERATION_OPTIONS,
  evaluateCompareOperation,
  normalizeCompareOperation,
  type CompareOperation,
} from "../../sensor-studio/core/flow/compare-operations";

export { COMPARE_OPERATION_OPTIONS, type CompareOperation };

export type CourseDashboardWidgetCondition = {
  compareOp: CompareOperation;
  /** Compared against mapped live value (`displayValue`). Legacy JSON key: `threshold`. */
  compareValue: number;
};

export const COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT: CourseDashboardWidgetCondition = {
  compareOp: ">=",
  compareValue: 0.5,
};

export function readCourseDashboardWidgetCondition(
  style: Record<string, unknown>,
): CourseDashboardWidgetCondition {
  const compareValueRaw =
    typeof style.compareValue === "number"
      ? style.compareValue
      : typeof style.threshold === "number"
        ? style.threshold
        : COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT.compareValue;

  const compareValue = Number.isFinite(compareValueRaw)
    ? compareValueRaw
    : COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT.compareValue;

  const hasExplicitOp = typeof style.compareOp === "string" && style.compareOp.length > 0;
  const compareOp = hasExplicitOp
    ? normalizeCompareOperation(style.compareOp)
    : COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT.compareOp;

  return { compareOp, compareValue };
}

/** LED / status ON when condition matches mapped numeric value; boolean paths bypass compare. */
export function resolveCourseDashboardWidgetActive(args: {
  rawValue: number | boolean | null;
  displayValue: number | null;
  condition: CourseDashboardWidgetCondition;
  bindingValueKind?: "number" | "boolean";
}): boolean {
  if (args.bindingValueKind === "boolean" || typeof args.rawValue === "boolean") {
    return args.rawValue === true;
  }

  const value =
    args.displayValue != null && Number.isFinite(args.displayValue)
      ? args.displayValue
      : typeof args.rawValue === "number" && Number.isFinite(args.rawValue)
        ? args.rawValue
        : null;

  if (value == null) {
    return false;
  }

  return evaluateCompareOperation(args.condition.compareOp, value, args.condition.compareValue);
}
