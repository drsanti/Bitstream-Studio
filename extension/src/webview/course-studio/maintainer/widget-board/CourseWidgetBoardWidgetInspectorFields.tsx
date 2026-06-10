import { Gauge, Link2, SlidersHorizontal } from "lucide-react";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { WidgetBoardEntryV1 } from "../../schemas/widgetBoard.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { CourseLiveBindingField } from "../binding/CourseLiveBindingField";
import { formatPlacementOccupancyHint } from "../blockPlacement";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import {
  WIDGET_BOARD_PALETTE,
  widgetBoardWidgetKindIcon,
  widgetBoardWidgetKindLabel,
} from "./widgetBoardPaletteMeta";
import { patchWidgetBoardWidget, patchWidgetBoardWidgetKind } from "./widgetBoardEditorOps";
import { CourseWidgetBoardTypographyInspectorFields } from "./CourseWidgetBoardTypographyInspectorFields";
import { CourseWidgetBoardScaleReadoutFields } from "./CourseWidgetBoardScaleReadoutFields";
import { CourseWidgetBoardMapRangeInspectorFields } from "./CourseWidgetBoardMapRangeInspectorFields";
import { CourseWidgetBoardHeroGaugeInspectorFields } from "./CourseWidgetBoardHeroGaugeInspectorFields";

export function CourseWidgetBoardWidgetInspectorFields({
  block,
  widget,
  staleMs,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
  widget: WidgetBoardEntryV1;
  staleMs?: number;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  const patchWidget = (patch: Partial<WidgetBoardEntryV1>) => {
    const next = patchWidgetBoardWidget(block, widget.id, patch);
    updateBlock(block.id, { widgets: next.widgets });
  };

  return (
    <div className="flex flex-col gap-3">
      <CourseInspectorCard
        title={widgetBoardWidgetKindLabel(widget.kind)}
        hint={formatPlacementOccupancyHint(widget.placement)}
        titleIcon={widgetBoardWidgetKindIcon(widget.kind)}
        defaultCollapsed={false}
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${widget.id}-kind`} label="Widget type">
            <TRNSelect
              value={widget.kind}
              ariaLabel="Widget type"
              variant="field"
              size="sm"
              showSelectedIconInTrigger
              options={WIDGET_BOARD_PALETTE.map((entry) => ({
                value: entry.kind,
                label: entry.label,
                icon: widgetBoardWidgetKindIcon(entry.kind),
              }))}
              onValueChange={(value) => {
                const next = patchWidgetBoardWidgetKind(
                  widget,
                  value as WidgetBoardEntryV1["kind"],
                  block,
                );
                updateBlock(block.id, {
                  widgets: block.widgets.map((entry) =>
                    entry.id === widget.id ? next : entry,
                  ),
                });
              }}
            />
          </TRNFormField>

          {widget.kind === "metric-bar" || widget.kind === "hero-radial-gauge" ? (
            <TRNFormField
              id={`${widget.id}-label`}
              label="Label"
              hint={
                widget.kind === "hero-radial-gauge"
                  ? "Optional caption above the ring. Leave empty to hide."
                  : undefined
              }
            >
              <TRNInput
                id={`${widget.id}-label`}
                variant="outlined"
                size="sm"
                className="w-full"
                value={widget.kind === "metric-bar" ? widget.label : (widget.label ?? "")}
                onChange={(e) => {
                  const next = e.target.value;
                  if (widget.kind === "metric-bar") {
                    patchWidget({ label: next });
                    return;
                  }
                  patchWidget({ label: next.length > 0 ? next : undefined });
                }}
              />
            </TRNFormField>
          ) : null}
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Data binding"
        hint="Map to a sensor catalog path. Live samples override the demo value."
        titleIcon={<Link2 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <div className="flex flex-col gap-2">
          <CourseLiveBindingField
            label="Live value"
            binding={widget.binding ?? null}
            staleMs={staleMs}
            onChange={(binding) => patchWidget({ binding: binding ?? undefined })}
          />
        </div>
      </CourseInspectorCard>

      <CourseWidgetBoardMapRangeInspectorFields
        widget={widget}
        staleMs={staleMs}
        onPatchBinding={(binding) => patchWidget({ binding })}
      />

      <CourseInspectorCard
        title="Scale & readout"
        hint={
          widget.binding?.path != null && widget.binding.path.length > 0
            ? "Visual range and demo value. Unit label is set under Data binding."
            : "Visual bar/gauge range, formatting, and demo value (after map range)."
        }
        titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <CourseWidgetBoardScaleReadoutFields widget={widget} onPatch={patchWidget} />
      </CourseInspectorCard>

      {widget.kind === "hero-radial-gauge" ? (
        <CourseWidgetBoardHeroGaugeInspectorFields widget={widget} onPatch={patchWidget} />
      ) : null}

      <CourseWidgetBoardTypographyInspectorFields
        block={block}
        widget={widget}
        onPatchTypography={(typography) => patchWidget({ typography })}
      />

      <CourseInspectorCard
        title="Placement"
        hint="Resize and move on the Widget Editor canvas or page grid."
        titleIcon={<SlidersHorizontal className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed
      >
        <TRNHintText tone="muted">
          Inner placement: column {widget.placement.column}, row {widget.placement.row},{" "}
          {widget.placement.columnSpan}×{widget.placement.rowSpan} cells. Drag handles on the
          canvas update placement; numeric fields are backlog.
        </TRNHintText>
      </CourseInspectorCard>
    </div>
  );
}
