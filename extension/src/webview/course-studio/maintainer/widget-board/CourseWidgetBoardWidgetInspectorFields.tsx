import { Gauge, Link2, SlidersHorizontal } from "lucide-react";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { WidgetBoardEntryV1 } from "../../schemas/widgetBoard.v1";
import {
  WIDGET_BOARD_BOOLEAN_WIDGET_KINDS,
  WIDGET_BOARD_SCALAR_WIDGET_KINDS,
} from "../../schemas/widgetBoard.v1";
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
import { CourseWidgetBoardAppearanceInspectorFields } from "./CourseWidgetBoardAppearanceInspectorFields";
import { CourseWidgetBoardReadoutLayoutInspectorFields } from "./CourseWidgetBoardReadoutLayoutInspectorFields";
import { CourseWidgetBoardConditionInspectorFields } from "./CourseWidgetBoardConditionInspectorFields";
import { CourseInfographicInspectorFields } from "../infographics/CourseInfographicInspectorFields";
import { coerceInfographicVisualPreset } from "../../schemas/infographicVisualPreset.v1";

function widgetLabelValue(widget: WidgetBoardEntryV1): string {
  if (widget.kind === "hero-radial-gauge") {
    return widget.label ?? "";
  }
  return widget.label;
}

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

  const labelHint =
    widget.kind === "hero-radial-gauge"
      ? "Optional caption above the ring. Leave empty to hide."
      : undefined;

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

          <TRNFormField id={`${widget.id}-label`} label="Label" hint={labelHint}>
            <TRNInput
              id={`${widget.id}-label`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={widgetLabelValue(widget)}
              onChange={(e) => {
                const next = e.target.value;
                if (widget.kind === "hero-radial-gauge") {
                  patchWidget({ label: next.length > 0 ? next : undefined });
                  return;
                }
                patchWidget({ label: next });
              }}
            />
          </TRNFormField>
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

      {WIDGET_BOARD_SCALAR_WIDGET_KINDS.has(widget.kind) ? (
        <CourseInspectorCard
          title="Scale & readout"
          hint={
            widget.binding?.path != null && widget.binding.path.length > 0
              ? "Visual range and demo value. Unit label is set under Data binding when bound."
              : "Visual bar/gauge range, formatting, and demo value (after map range)."
          }
          titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
          defaultCollapsed={false}
        >
          <CourseWidgetBoardScaleReadoutFields widget={widget} onPatch={patchWidget} />
        </CourseInspectorCard>
      ) : null}

      {WIDGET_BOARD_BOOLEAN_WIDGET_KINDS.has(widget.kind) ? (
        <CourseWidgetBoardConditionInspectorFields
          widget={widget}
          staleMs={staleMs}
          onPatch={patchWidget}
        />
      ) : null}

      <CourseWidgetBoardAppearanceInspectorFields widget={widget} onPatch={patchWidget} />

      {widget.kind !== "hero-radial-gauge" ? (
        <CourseWidgetBoardReadoutLayoutInspectorFields
          widget={widget}
          onPatch={patchWidget}
          syncValueAlign={widget.kind === "numeric-readout"}
        />
      ) : null}

      {widget.kind === "metric-bar" ||
      widget.kind === "numeric-readout" ||
      widget.kind === "vertical-bar" ? (
        <CourseInfographicInspectorFields
          idPrefix={widget.id}
          visualPreset={coerceInfographicVisualPreset(widget.visualPreset)}
          configSource={widget as unknown as Record<string, unknown>}
          bindingPath={widget.binding?.path}
          onPatch={(patch) => patchWidget(patch as Partial<WidgetBoardEntryV1>)}
        />
      ) : null}

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
