import { Gauge, Palette, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import {
  coerceRadialGaugeConfig,
  GAUGE_ZONE_PRESET_OPTIONS,
  gaugeZonesFromPreset,
  matchGaugeZonePreset,
  RADIAL_GAUGE_ARC_PRESET_OPTIONS,
  type GaugeZonePresetId,
  type RadialGaugeArcPresetId,
} from "../../sensor-studio/features/editor/nodes/display/gauge-display-config";
import { COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT } from "../schemas/courseLiveBindingDefaults";
import { CourseGaugeScaleReadoutFields } from "./CourseGaugeScaleReadoutFields";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";

const GAUGE_ZONE_SELECT_OPTIONS = [
  ...GAUGE_ZONE_PRESET_OPTIONS.map((opt) => ({
    value: opt.id,
    label: opt.label,
  })),
  { value: "custom" as const, label: "Custom (from page JSON)" },
];

function readGaugeBoolean(style: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return typeof style[key] === "boolean" ? (style[key] as boolean) : fallback;
}

function resolveZonePresetSelect(
  style: Record<string, unknown>,
  min: number,
  max: number,
): GaugeZonePresetId | "custom" {
  if (
    style.zonePreset === "traffic" ||
    style.zonePreset === "monochrome" ||
    style.zonePreset === "cold-hot"
  ) {
    return style.zonePreset;
  }
  const cfg = coerceRadialGaugeConfig(style);
  return matchGaugeZonePreset(cfg.zones, min, max);
}

function withZonesForPreset(
  style: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...style, ...patch };
  const min = typeof next.min === "number" ? next.min : COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.min;
  const max = typeof next.max === "number" ? next.max : COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.max;
  const preset =
    next.zonePreset === "traffic" ||
    next.zonePreset === "monochrome" ||
    next.zonePreset === "cold-hot"
      ? next.zonePreset
      : resolveZonePresetSelect(next, min, max);
  if (preset === "custom") {
    return next;
  }
  return {
    ...next,
    zonePreset: preset,
    zones: gaugeZonesFromPreset(preset, min, max),
  };
}

export function CourseRadialGaugeInspectorFields({
  blockId,
  style,
  onPatch,
}: {
  blockId: string;
  style: Record<string, unknown>;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const cfg = useMemo(() => coerceRadialGaugeConfig(style), [style]);
  const zonePreset = resolveZonePresetSelect(style, cfg.min, cfg.max);
  const zoneHint =
    GAUGE_ZONE_PRESET_OPTIONS.find((opt) => opt.id === zonePreset)?.hint ??
    "Arc colors follow the zones array saved on this block.";

  const patchGauge = (patch: Record<string, unknown>) => {
    onPatch(withZonesForPreset(style, patch));
  };

  return (
    <>
      <CourseInspectorCard
        title="Scale & readout"
        hint="Arc scale and numeric readout under the needle."
        titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <CourseGaugeScaleReadoutFields
          cfg={cfg}
          labelPrefix="Radial gauge"
          minDescription="Scale start — needle and ticks map incoming values into [min, max]."
          defaultMin={COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.min}
          defaultMax={COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.max}
          defaultDecimals={COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.decimals}
          onPatch={(patch) => patchGauge(patch)}
        />
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Zones"
        hint="Colored arc bands"
        titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <TRNFormField id={`${blockId}-zone-preset`} label="Zone preset">
          <TRNSelect
            value={zonePreset}
            ariaLabel="Gauge zone preset"
            options={GAUGE_ZONE_SELECT_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            onValueChange={(value) => {
              if (
                value === "traffic" ||
                value === "monochrome" ||
                value === "cold-hot"
              ) {
                patchGauge({ zonePreset: value });
              }
            }}
          />
        </TRNFormField>
        <TRNHintText tone="muted" className="mt-1.5">
          {zoneHint}
        </TRNHintText>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Readout"
        titleIcon={<SlidersHorizontal className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <div className="flex flex-col gap-2">
          <TRNInlineToggleRow
            label="Digital value (top)"
            checked={readGaugeBoolean(
              style,
              "showDigitalValue",
              COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showDigitalValue,
            )}
            onCheckedChange={(showDigitalValue) => onPatch({ showDigitalValue })}
            ariaLabel="Show digital value above needle hub"
          />
          <TRNInlineToggleRow
            label="Unit label (bottom)"
            checked={readGaugeBoolean(
              style,
              "showUnit",
              COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showUnit,
            )}
            onCheckedChange={(showUnit) => onPatch({ showUnit })}
            ariaLabel="Show unit below needle hub"
          />
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Motion"
        defaultCollapsed
      >
        <TRNFormField id={`${blockId}-needle-smoothing`} label="Needle smoothing (ms)">
          <CourseMaintainerScrubNumberField
            ariaLabel="Radial gauge needle smoothing milliseconds"
            value={cfg.needleSmoothingMs}
            min={0}
            max={5000}
            step={50}
            fractionDigits={0}
            defaultValue={COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.needleSmoothingMs}
            onChange={(needleSmoothingMs) =>
              onPatch({ needleSmoothingMs: Math.max(0, Math.round(needleSmoothingMs)) })
            }
          />
        </TRNFormField>
        <TRNHintText tone="muted" className="mt-1.5">
          Higher values smooth jittery telemetry. Use 0 to snap the needle to each sample.
        </TRNHintText>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Appearance"
        titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${blockId}-arc-preset`} label="Arc style">
            <TRNSelect
              value={cfg.arcPreset}
              ariaLabel="Radial gauge arc style"
              options={RADIAL_GAUGE_ARC_PRESET_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
              }))}
              onValueChange={(value) => {
                if (
                  value === "automotive270" ||
                  value === "semicircle180" ||
                  value === "wide240"
                ) {
                  onPatch({ arcPreset: value as RadialGaugeArcPresetId });
                }
              }}
            />
          </TRNFormField>
          <TRNInlineToggleRow
            label="Tick marks"
            checked={readGaugeBoolean(style, "showTicks", COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showTicks)}
            onCheckedChange={(showTicks) => onPatch({ showTicks })}
            ariaLabel="Show tick marks"
          />
          <TRNInlineToggleRow
            label="Tick labels"
            checked={readGaugeBoolean(
              style,
              "showTickLabels",
              COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showTickLabels,
            )}
            onCheckedChange={(showTickLabels) => onPatch({ showTickLabels })}
            ariaLabel="Show tick labels"
          />
          <TRNInlineToggleRow
            label="Faceplate"
            checked={readGaugeBoolean(
              style,
              "showFaceplate",
              COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showFaceplate,
            )}
            onCheckedChange={(showFaceplate) => onPatch({ showFaceplate })}
            ariaLabel="Show gauge faceplate"
          />
          <TRNInlineToggleRow
            label="Track arc"
            checked={readGaugeBoolean(style, "showTrack", COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showTrack)}
            onCheckedChange={(showTrack) => onPatch({ showTrack })}
            ariaLabel="Show neutral track arc"
          />
          <TRNInlineToggleRow
            label="Needle"
            checked={readGaugeBoolean(style, "showNeedle", COURSE_DASHBOARD_WIDGET_GAUGE_STYLE_DEFAULT.showNeedle)}
            onCheckedChange={(showNeedle) => onPatch({ showNeedle })}
            ariaLabel="Show gauge needle"
          />
        </div>
      </CourseInspectorCard>
    </>
  );
}
