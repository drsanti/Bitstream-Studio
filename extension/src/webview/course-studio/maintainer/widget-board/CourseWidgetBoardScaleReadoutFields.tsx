import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import type { WidgetBoardEntryV1 } from "../../schemas/widgetBoard.v1";
import { WIDGET_BOARD_SCALAR_WIDGET_KINDS } from "../../schemas/widgetBoard.v1";
import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "../CourseInspectorFieldGrid";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";
import { widgetBoardWidgetKindLabel } from "./widgetBoardPaletteMeta";

function widgetHasBoundPath(widget: WidgetBoardEntryV1): boolean {
  return widget.binding?.path != null && widget.binding.path.length > 0;
}

export function CourseWidgetBoardScaleReadoutFields({
  widget,
  onPatch,
}: {
  widget: WidgetBoardEntryV1;
  onPatch: (patch: Partial<WidgetBoardEntryV1>) => void;
}) {
  if (!WIDGET_BOARD_SCALAR_WIDGET_KINDS.has(widget.kind)) {
    return null;
  }

  const labelPrefix = widgetBoardWidgetKindLabel(widget.kind);
  const bound = widgetHasBoundPath(widget);
  const showUnitField =
    widget.kind === "hero-radial-gauge" ||
    widget.kind === "numeric-readout" ||
    widget.kind === "vertical-bar";

  return (
    <div className="flex flex-col gap-2">
      <CourseInspectorFieldGrid>
        <CourseInspectorFieldGridLabels
          left={{
            label: "Min",
            description:
              "Visual scale start — bar fill and gauge arc normalize the mapped value into [min, max].",
          }}
          right={{ label: "Max", description: "Visual scale end." }}
        />
        <CourseInspectorFieldGridControls
          left={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} minimum`}
              value={widget.min}
              step={0.01}
              onChange={(min) => onPatch({ min })}
            />
          }
          right={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} maximum`}
              value={widget.max}
              step={0.01}
              onChange={(max) => onPatch({ max })}
            />
          }
        />
      </CourseInspectorFieldGrid>

      {showUnitField && !bound ? (
        <TRNFormField
          id={`${widget.id}-unit`}
          label="Unit label"
          hint="Suffix when no live binding is set."
        >
          <TRNInput
            variant="outlined"
            size="sm"
            className="w-full"
            aria-label={`${labelPrefix} unit label`}
            value={widget.unit ?? ""}
            placeholder="e.g. %"
            onChange={(event) => onPatch({ unit: event.target.value })}
          />
        </TRNFormField>
      ) : null}

      <CourseInspectorFieldGrid>
        <CourseInspectorFieldGridLabels
          left={{ label: "Decimals" }}
          right={{
            label: "Demo value",
            description: "Shown when live binding has no sample.",
          }}
        />
        <CourseInspectorFieldGridControls
          left={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} decimal places`}
              value={widget.decimals}
              min={0}
              max={6}
              step={1}
              fractionDigits={0}
              onChange={(decimals) => onPatch({ decimals: Math.round(decimals) })}
            />
          }
          right={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} demo value`}
              value={widget.demoValue ?? 0}
              onChange={(demoValue) => onPatch({ demoValue })}
            />
          }
        />
      </CourseInspectorFieldGrid>
    </div>
  );
}
