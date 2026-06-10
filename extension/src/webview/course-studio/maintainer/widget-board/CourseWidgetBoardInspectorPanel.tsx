import { MousePointerClick } from "lucide-react";
import type { PageBlockV1 } from "../../schemas/page.v1";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { CourseWidgetBoardBlockInspectorFields } from "../CourseWidgetBoardBlockInspectorFields";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { CourseWidgetBoardWidgetInspectorFields } from "./CourseWidgetBoardWidgetInspectorFields";
import { useCourseWidgetBoardEditorStore } from "./useCourseWidgetBoardEditorStore";

export function CourseWidgetBoardInspectorPanel({
  block,
  staleMs,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
  staleMs?: number;
}) {
  const selectedWidgetId = useCourseWidgetBoardEditorStore((s) => s.selectedWidgetId);
  const selectedWidget =
    block.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <CourseWidgetBoardBlockInspectorFields block={block} />
      {selectedWidget != null ? (
        <CourseWidgetBoardWidgetInspectorFields
          block={block}
          widget={selectedWidget}
          staleMs={staleMs}
        />
      ) : (
        <CourseInspectorCard
          title="Inner widget"
          hint="Per-widget bindings, scale, and typography."
          titleIcon={<MousePointerClick className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
          defaultCollapsed={false}
        >
          <TRNHintText tone="muted">
            Select a widget on the board canvas to edit its type, live binding, scale, and
            typography overrides.
          </TRNHintText>
        </CourseInspectorCard>
      )}
    </div>
  );
}
