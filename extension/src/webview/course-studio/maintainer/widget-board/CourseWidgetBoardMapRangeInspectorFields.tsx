import { ArrowLeftRight } from "lucide-react";
import type { WidgetBoardEntryV1 } from "../../schemas/widgetBoard.v1";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { useCourseLiveBinding } from "../../runtime/useCourseLiveBinding";
import { CourseBindingMapTransformFields } from "../binding/CourseBindingMapTransformFields";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";

export function CourseWidgetBoardMapRangeInspectorFields({
  widget,
  staleMs,
  onPatchBinding,
}: {
  widget: WidgetBoardEntryV1;
  staleMs?: number;
  onPatchBinding: (binding: NonNullable<WidgetBoardEntryV1["binding"]>) => void;
}) {
  const live = useCourseLiveBinding(widget.binding ?? null, staleMs);
  const binding = live.binding;

  const rawValue =
    typeof live.rawValue === "number" && Number.isFinite(live.rawValue) ? live.rawValue : null;

  return (
    <CourseInspectorCard
      title="Map range"
      hint="Remap the live sensor value before scale and visualization."
      titleIcon={<ArrowLeftRight className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      {binding != null ? (
        <CourseBindingMapTransformFields
          binding={binding}
          onChange={onPatchBinding}
          idPrefix={`${widget.id}-map`}
          rawValue={rawValue}
          displayValue={live.displayValue}
          unit={live.unit}
          format={binding.format}
        />
      ) : (
        <TRNHintText tone="muted">
          Bind a live sensor path in <strong>Data binding</strong> to remap raw telemetry into the
          display range used by this widget.
        </TRNHintText>
      )}
    </CourseInspectorCard>
  );
}
