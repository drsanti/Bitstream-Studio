import { Gauge, Link2 } from "lucide-react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { PageBlockV1 } from "../schemas/page.v1";
import {
  COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING,
  COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT,
  COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
} from "../schemas/courseLiveBindingDefaults";
import {
  COURSE_DASHBOARD_WIDGET_KIND_OPTIONS,
  defaultCourseDashboardWidgetStyle,
  ensureCourseDashboardWidgetPlacement,
  type CourseDashboardWidgetKind,
} from "../schemas/courseDashboardWidgetKinds";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import { CourseGaugeScaleReadoutFields } from "./CourseGaugeScaleReadoutFields";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { CourseRadialGaugeInspectorFields } from "./CourseRadialGaugeInspectorFields";
import { CourseDashboardWidgetConditionCard } from "./CourseDashboardWidgetConditionCard";
import { DashboardWidgetColorsCard } from "./CourseDashboardWidgetBlockColorsCard";
import { CourseLiveBindingField } from "./binding/CourseLiveBindingField";
import { catalogEntryForPath } from "../runtime/diagram/diagramBindingCatalog";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { CourseInfographicInspectorFields } from "./infographics/CourseInfographicInspectorFields";
import { coerceInfographicVisualPreset } from "../schemas/infographicVisualPreset.v1";

function readTextStyle(style: Record<string, unknown>) {
  return {
    label:
      typeof style.label === "string" ? style.label : COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT.label,
    unit: typeof style.unit === "string" ? style.unit : COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT.unit,
    decimals:
      typeof style.decimals === "number"
        ? style.decimals
        : COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT.decimals,
    showStatusBar:
      typeof style.showStatusBar === "boolean"
        ? style.showStatusBar
        : COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT.showStatusBar,
  };
}

function readLedStyle(style: Record<string, unknown>) {
  return {
    label:
      typeof style.label === "string" ? style.label : COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT.label,
    blink:
      typeof style.blink === "boolean" ? style.blink : COURSE_DASHBOARD_WIDGET_LED_STYLE_DEFAULT.blink,
  };
}

function readScaleStyle(style: Record<string, unknown>, defaults: { min: number; max: number; unit: string; decimals: number }) {
  return {
    min: typeof style.min === "number" ? style.min : defaults.min,
    max: typeof style.max === "number" ? style.max : defaults.max,
    unit: typeof style.unit === "string" ? style.unit : defaults.unit,
    decimals: typeof style.decimals === "number" ? style.decimals : defaults.decimals,
    orientation: style.orientation === "horizontal" ? "horizontal" as const : "vertical" as const,
    showPeakHold:
      typeof style.showPeakHold === "boolean" ? style.showPeakHold : true,
  };
}

function readStatusStyle(style: Record<string, unknown>) {
  return {
    label:
      typeof style.label === "string" ? style.label : COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT.label,
    onLabel:
      typeof style.onLabel === "string" ? style.onLabel : COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT.onLabel,
    offLabel:
      typeof style.offLabel === "string" ? style.offLabel : COURSE_DASHBOARD_WIDGET_STATUS_STYLE_DEFAULT.offLabel,
  };
}

function CourseDashboardWidgetScaleFields({
  blockId,
  style,
  defaults,
  onPatch,
}: {
  blockId: string;
  style: Record<string, unknown>;
  defaults: { min: number; max: number; unit: string; decimals: number };
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const scale = readScaleStyle(style, defaults);

  return (
    <div className="flex flex-col gap-2">
      <CourseGaugeScaleReadoutFields
        cfg={scale}
        labelPrefix="Bar meter"
        minDescription="Scale start — fill height maps incoming values into [min, max]."
        defaultMin={defaults.min}
        defaultMax={defaults.max}
        defaultDecimals={defaults.decimals}
        onPatch={(patch) => onPatch(patch)}
      />
      <TRNFormField id={`${blockId}-orientation`} label="Orientation">
        <TRNSelect
          value={scale.orientation}
          ariaLabel="Bar meter orientation"
          options={[
            { value: "vertical", label: "Vertical" },
            { value: "horizontal", label: "Horizontal" },
          ]}
          onValueChange={(value) => {
            if (value === "vertical" || value === "horizontal") {
              onPatch({ orientation: value });
            }
          }}
        />
      </TRNFormField>
      <TRNInlineToggleRow
        label="Peak hold marker"
        checked={scale.showPeakHold}
        onCheckedChange={(showPeakHold) => onPatch({ showPeakHold })}
        ariaLabel="Show peak hold marker"
      />
    </div>
  );
}

export function CourseDashboardWidgetBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "dashboard-widget" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const binding = block.binding ?? COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING;
  const style = block.style ?? {};

  const patchStyle = (patch: Record<string, unknown>) => {
    updateBlock(block.id, { style: { ...style, ...patch } });
  };

  const setWidgetKind = (nextKind: CourseDashboardWidgetKind) => {
    if (nextKind === block.widgetKind) {
      return;
    }
    updateBlock(block.id, {
      widgetKind: nextKind,
      style: defaultCourseDashboardWidgetStyle(nextKind),
      placement: ensureCourseDashboardWidgetPlacement(block.placement, nextKind),
    });
  };

  const textStyle = readTextStyle(style);
  const ledStyle = readLedStyle(style);
  const statusStyle = readStatusStyle(style);
  const barDefaults = defaultCourseDashboardWidgetStyle("bar") as {
    min: number;
    max: number;
    unit: string;
    decimals: number;
  };
  const bindingValueKind = catalogEntryForPath(binding.path)?.valueKind;

  return (
    <div className="flex flex-col gap-3">
      <CourseEmojiTextField
        id={`${block.id}-title`}
        label="Title (optional)"
        value={block.title ?? ""}
        onChange={(title) => updateBlock(block.id, { title: title.length > 0 ? title : undefined })}
      />

      <CourseInspectorCard
        title="Widget"
        titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <TRNFormField id={`${block.id}-widget-kind`} label="Kind">
          <TRNSelect
            value={block.widgetKind}
            ariaLabel="Dashboard widget kind"
            options={COURSE_DASHBOARD_WIDGET_KIND_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            onValueChange={(value) => {
              if (
                value === "text" ||
                value === "led" ||
                value === "gauge" ||
                value === "bar" ||
                value === "status"
              ) {
                setWidgetKind(value);
              }
            }}
          />
        </TRNFormField>

        {block.widgetKind === "text" ? (
          <div className="mt-2 flex flex-col gap-2">
            <CourseEmojiTextField
              id={`${block.id}-label`}
              label="Label"
              value={textStyle.label}
              onChange={(label) => patchStyle({ label })}
            />
            <TRNFormField id={`${block.id}-unit`} label="Unit">
              <input
                id={`${block.id}-unit-input`}
                className="h-8 w-full rounded-md border border-zinc-700/80 bg-zinc-950/60 px-2 text-[12px] text-zinc-100"
                value={textStyle.unit}
                onChange={(e) => patchStyle({ unit: e.target.value })}
              />
            </TRNFormField>
            <TRNFormField id={`${block.id}-decimals`} label="Decimals">
              <CourseMaintainerScrubNumberInput
                value={textStyle.decimals}
                min={0}
                max={6}
                step={1}
                onChange={(decimals) => patchStyle({ decimals })}
              />
            </TRNFormField>
            <TRNInlineToggleRow
              label="Status bar"
              checked={textStyle.showStatusBar}
              onCheckedChange={(showStatusBar) => patchStyle({ showStatusBar })}
              ariaLabel="Show status bar"
            />
          </div>
        ) : null}

        {block.widgetKind === "led" ? (
          <div className="mt-2 flex flex-col gap-2">
            <CourseEmojiTextField
              id={`${block.id}-led-label`}
              label="Label"
              value={ledStyle.label}
              onChange={(label) => patchStyle({ label })}
            />
            <TRNInlineToggleRow
              label="Blink when on"
              checked={ledStyle.blink}
              onCheckedChange={(blink) => patchStyle({ blink })}
              ariaLabel="Blink when on"
            />
          </div>
        ) : null}

        {block.widgetKind === "bar" ? (
          <div className="mt-2">
            <CourseDashboardWidgetScaleFields
              blockId={block.id}
              style={style}
              defaults={{
                min: barDefaults.min,
                max: barDefaults.max,
                unit: barDefaults.unit,
                decimals: barDefaults.decimals,
              }}
              onPatch={patchStyle}
            />
          </div>
        ) : null}

        {block.widgetKind === "status" ? (
          <div className="mt-2 flex flex-col gap-2">
            <CourseEmojiTextField
              id={`${block.id}-status-label`}
              label="Row label"
              value={statusStyle.label}
              onChange={(label) => patchStyle({ label })}
            />
            <TRNFormField id={`${block.id}-on-label`} label="Active label">
              <input
                id={`${block.id}-on-label-input`}
                className="h-8 w-full rounded-md border border-zinc-700/80 bg-zinc-950/60 px-2 text-[12px] text-zinc-100"
                value={statusStyle.onLabel}
                onChange={(e) => patchStyle({ onLabel: e.target.value })}
              />
            </TRNFormField>
            <TRNFormField id={`${block.id}-off-label`} label="Inactive label">
              <input
                id={`${block.id}-off-label-input`}
                className="h-8 w-full rounded-md border border-zinc-700/80 bg-zinc-950/60 px-2 text-[12px] text-zinc-100"
                value={statusStyle.offLabel}
                onChange={(e) => patchStyle({ offLabel: e.target.value })}
              />
            </TRNFormField>
          </div>
        ) : null}
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Data binding"
        titleIcon={<Link2 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <CourseLiveBindingField
          label="Value"
          binding={binding}
          onChange={(next) => updateBlock(block.id, { binding: next ?? undefined })}
        />
      </CourseInspectorCard>

      <CourseDashboardWidgetConditionCard
        block={block}
        style={style}
        bindingPath={binding.path}
        bindingValueKind={bindingValueKind}
        onPatch={patchStyle}
      />

      {block.widgetKind === "gauge" ? (
        <CourseRadialGaugeInspectorFields
          blockId={block.id}
          style={style}
          onPatch={patchStyle}
        />
      ) : null}

      {block.widgetKind === "text" ||
      block.widgetKind === "bar" ||
      block.widgetKind === "gauge" ? (
        <CourseInfographicInspectorFields
          idPrefix={block.id}
          visualPreset={coerceInfographicVisualPreset(style.visualPreset)}
          configSource={style}
          bindingPath={binding.path}
          onPatch={patchStyle}
        />
      ) : null}

      <DashboardWidgetColorsCard block={block} />
    </div>
  );
}
