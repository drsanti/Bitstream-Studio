import { GitCompare } from "lucide-react";
import type { PageBlockV1 } from "../schemas/page.v1";
import { CourseDashboardWidgetConditionFields } from "./CourseDashboardWidgetConditionFields";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";

export function CourseDashboardWidgetConditionCard({
  block,
  style,
  bindingPath,
  bindingValueKind,
  onPatch,
}: {
  block: Extract<PageBlockV1, { kind: "dashboard-widget" }>;
  style: Record<string, unknown>;
  bindingPath?: string;
  bindingValueKind?: "number" | "boolean";
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  if (block.widgetKind !== "led" && block.widgetKind !== "status") {
    return null;
  }

  const activeLabel = block.widgetKind === "led" ? "ON" : "Active";

  return (
    <CourseInspectorCard
      title="ON/OFF rule"
      hint={`When the mapped live value satisfies the compare rule, the widget turns ${activeLabel}. Boolean bindings skip the rule.`}
      titleIcon={<GitCompare className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <CourseDashboardWidgetConditionFields
        blockId={block.id}
        style={style}
        bindingPath={bindingPath}
        bindingValueKind={bindingValueKind}
        onPatch={onPatch}
      />
    </CourseInspectorCard>
  );
}
