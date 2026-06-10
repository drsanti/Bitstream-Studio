import type { DiagramBindingV1 } from "../../../schemas/diagram.v1";
import {
  resolveCourseDashboardWidgetActive,
  type CourseDashboardWidgetCondition,
} from "../../../schemas/courseDashboardWidgetCondition";
import { catalogEntryForPath } from "../../../runtime/diagram/diagramBindingCatalog";

export function resolveWidgetBoardBooleanActive(args: {
  binding?: DiagramBindingV1 | null;
  rawValue: number | boolean | null;
  displayValue: number | null;
  condition: CourseDashboardWidgetCondition;
  demoActive: boolean;
  hasLiveSample: boolean;
}): boolean {
  const hasBinding = args.binding?.path != null && args.binding.path.length > 0;
  if (!hasBinding) {
    return args.demoActive;
  }
  if (!args.hasLiveSample && args.rawValue == null) {
    return args.demoActive;
  }

  const catalog = catalogEntryForPath(args.binding?.path ?? "");
  return resolveCourseDashboardWidgetActive({
    rawValue: args.rawValue,
    displayValue: args.displayValue,
    condition: args.condition,
    bindingValueKind: catalog?.valueKind,
  });
}
