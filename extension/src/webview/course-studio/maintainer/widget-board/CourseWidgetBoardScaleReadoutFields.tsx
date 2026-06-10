import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import type { WidgetBoardEntryV1 } from "../../schemas/widgetBoard.v1";
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
  const labelPrefix = widgetBoardWidgetKindLabel(widget.kind);
  const bound = widgetHasBoundPath(widget);

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

      {widget.kind === "hero-radial-gauge" ? (
        bound ? (
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
        ) : (
          <>
            <CourseInspectorFieldGrid>
              <CourseInspectorFieldGridLabels
                left={{
                  label: "Unit label",
                  description: "Suffix under the gauge when no live binding is set.",
                }}
                right={{ label: "Decimals" }}
              />
              <CourseInspectorFieldGridControls
                left={
                  <TRNInput
                    variant="outlined"
                    size="sm"
                    className="w-full"
                    aria-label={`${labelPrefix} unit label`}
                    value={widget.unit ?? ""}
                    placeholder="e.g. km/h"
                    onChange={(event) => onPatch({ unit: event.target.value })}
                  />
                }
                right={
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
              />
            </CourseInspectorFieldGrid>
            <TRNFormField id={`${widget.id}-demo`} label="Demo value">
              <CourseMaintainerScrubNumberField
                ariaLabel={`${labelPrefix} demo value`}
                value={widget.demoValue ?? 0}
                onChange={(demoValue) => onPatch({ demoValue })}
              />
            </TRNFormField>
          </>
        )
      ) : (
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
      )}
    </div>
  );
}
