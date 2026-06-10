import { GitCompareArrows } from "lucide-react";
import type {
  WidgetBoardLedIndicatorV1,
  WidgetBoardStatusPillV1,
} from "../../schemas/widgetBoard.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  COMPARE_OPERATION_OPTIONS,
  COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT,
} from "../../schemas/courseDashboardWidgetCondition";
import { useCourseLiveBinding } from "../../runtime/useCourseLiveBinding";
import { catalogEntryForPath } from "../../runtime/diagram/diagramBindingCatalog";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";

type BooleanWidget = WidgetBoardStatusPillV1 | WidgetBoardLedIndicatorV1;

export function CourseWidgetBoardConditionInspectorFields({
  widget,
  staleMs,
  onPatch,
}: {
  widget: BooleanWidget;
  staleMs?: number;
  onPatch: (patch: Partial<BooleanWidget>) => void;
}) {
  const live = useCourseLiveBinding(widget.binding ?? null, staleMs);
  const bindingPath = widget.binding?.path ?? "";
  const catalog = bindingPath.length > 0 ? catalogEntryForPath(bindingPath) : undefined;
  const isBooleanPath = catalog?.valueKind === "boolean";

  return (
    <CourseInspectorCard
      title="ON / OFF rule"
      hint="Compare mapped live value or use demo state when unbound."
      titleIcon={<GitCompareArrows className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2">
        {isBooleanPath ? (
          <TRNHintText tone="muted">
            Boolean binding
            {bindingPath.length > 0 ? ` (${bindingPath})` : ""} — ON follows telemetry directly;
            compare rule is ignored.
          </TRNHintText>
        ) : (
          <>
            <TRNFormField id={`${widget.id}-compare-op`} label="ON when">
              <TRNSelect
                value={widget.compareOp}
                ariaLabel="Compare operator"
                variant="field"
                size="sm"
                options={COMPARE_OPERATION_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                onValueChange={(value) => {
                  if (typeof value === "string" && value.length > 0) {
                    onPatch({ compareOp: value as BooleanWidget["compareOp"] });
                  }
                }}
              />
            </TRNFormField>
            <TRNFormField id={`${widget.id}-compare-value`} label="Compare value">
              <CourseMaintainerScrubNumberField
                ariaLabel="Compare value for ON/OFF rule"
                value={widget.compareValue}
                step={0.1}
                defaultValue={COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT.compareValue}
                onChange={(compareValue) => onPatch({ compareValue })}
              />
            </TRNFormField>
            {live.displayValue != null ? (
              <TRNHintText tone="muted">
                Mapped live value: {live.displayValue}
                {live.unit.length > 0 ? ` ${live.unit}` : ""}
              </TRNHintText>
            ) : null}
          </>
        )}
        <TRNInlineToggleRow
          label="Demo ON"
          hint="Shown when no live binding or before the first sample arrives."
          checked={widget.demoActive}
          onCheckedChange={(demoActive) => onPatch({ demoActive })}
          ariaLabel="Demo ON state for widget board boolean widget"
        />
      </div>
    </CourseInspectorCard>
  );
}
