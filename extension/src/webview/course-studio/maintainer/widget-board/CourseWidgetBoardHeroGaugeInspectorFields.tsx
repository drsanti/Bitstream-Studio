import { Gauge, Timer } from "lucide-react";
import type { WidgetBoardHeroRadialGaugeV1 } from "../../schemas/widgetBoard.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  HERO_RADIAL_GAUGE_ARC_CAP_OPTIONS,
  HERO_RADIAL_GAUGE_ARC_PRESET_OPTIONS,
  HERO_RADIAL_GAUGE_DEFAULTS,
  HERO_RADIAL_GAUGE_ZONE_TINT_OPTIONS,
  type HeroRadialGaugeArcCapId,
  type HeroRadialGaugeArcPresetId,
  type HeroRadialGaugeZoneTintId,
} from "../../ui/catalog/widget-board/heroRadialGaugeConfig";
import { CourseWidgetBoardHeroTileLayoutInspectorFields } from "./CourseWidgetBoardReadoutLayoutInspectorFields";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";

export function CourseWidgetBoardHeroGaugeInspectorFields({
  widget,
  onPatch,
}: {
  widget: WidgetBoardHeroRadialGaugeV1;
  onPatch: (patch: Partial<WidgetBoardHeroRadialGaugeV1>) => void;
}) {
  const arcHint =
    HERO_RADIAL_GAUGE_ARC_PRESET_OPTIONS.find((opt) => opt.id === widget.heroArcPreset)?.hint ??
    "Arc sweep for the hero ring.";
  const zoneTintHint =
    HERO_RADIAL_GAUGE_ZONE_TINT_OPTIONS.find((opt) => opt.id === widget.zoneTint)?.hint ??
    "Arc tip color from board theme.";
  const arcCapHint =
    HERO_RADIAL_GAUGE_ARC_CAP_OPTIONS.find((opt) => opt.id === widget.arcCap)?.hint ??
    "Arc tip shape.";

  return (
    <>
      <CourseWidgetBoardHeroTileLayoutInspectorFields widget={widget} onPatch={onPatch} />

      <CourseInspectorCard
        title="Arc"
        hint="Ring geometry for the hero gauge."
        titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${widget.id}-hero-arc`} label="Arc preset">
            <TRNSelect
              value={widget.heroArcPreset}
              ariaLabel="Hero radial gauge arc preset"
              variant="field"
              size="sm"
              options={HERO_RADIAL_GAUGE_ARC_PRESET_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
              }))}
              onValueChange={(value) => {
                if (value === "hero140" || value === "semicircle" || value === "wide") {
                  onPatch({ heroArcPreset: value as HeroRadialGaugeArcPresetId });
                }
              }}
            />
          </TRNFormField>
          <TRNHintText tone="muted">{arcHint}</TRNHintText>
          <TRNFormField id={`${widget.id}-hole-size`} label="Hole size (%)">
            <CourseMaintainerScrubNumberField
              ariaLabel="Hero radial gauge center hole size percent"
              value={widget.holeSizePercent}
              min={8}
              max={20}
              step={1}
              fractionDigits={0}
              defaultValue={HERO_RADIAL_GAUGE_DEFAULTS.holeSizePercent}
              onChange={(holeSizePercent) =>
                onPatch({ holeSizePercent: Math.max(8, Math.min(20, Math.round(holeSizePercent))) })
              }
            />
          </TRNFormField>
          <TRNFormField id={`${widget.id}-zone-tint`} label="Zone tint">
            <TRNSelect
              value={widget.zoneTint}
              ariaLabel="Hero radial gauge zone tint"
              variant="field"
              size="sm"
              options={HERO_RADIAL_GAUGE_ZONE_TINT_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
              }))}
              onValueChange={(value) => {
                if (value === "off" || value === "traffic" || value === "cold-hot") {
                  onPatch({ zoneTint: value as HeroRadialGaugeZoneTintId });
                }
              }}
            />
          </TRNFormField>
          <TRNHintText tone="muted">{zoneTintHint}</TRNHintText>
          <TRNFormField id={`${widget.id}-arc-cap`} label="Arc cap">
            <TRNSelect
              value={widget.arcCap}
              ariaLabel="Hero radial gauge arc cap style"
              variant="field"
              size="sm"
              options={HERO_RADIAL_GAUGE_ARC_CAP_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
              }))}
              onValueChange={(value) => {
                if (value === "round" || value === "butt") {
                  onPatch({ arcCap: value as HeroRadialGaugeArcCapId });
                }
              }}
            />
          </TRNFormField>
          <TRNHintText tone="muted">{arcCapHint}</TRNHintText>
          <TRNInlineToggleRow
            label="Live glow"
            hint="Board theme bloom around the ring. Turn off for flat readouts."
            checked={widget.showGlow}
            onCheckedChange={(showGlow) => onPatch({ showGlow })}
            ariaLabel="Show live glow on hero radial gauge"
          />
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Readout"
        hint="Center value and unit under the arc."
        titleIcon={<Gauge className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed
      >
        <div className="flex flex-col gap-2">
          <TRNInlineToggleRow
            label="Digital value"
            checked={widget.showValue}
            onCheckedChange={(showValue) => onPatch({ showValue })}
            ariaLabel="Show digital value in hero gauge center"
          />
          <TRNInlineToggleRow
            label="Unit label"
            checked={widget.showUnit}
            onCheckedChange={(showUnit) => onPatch({ showUnit })}
            ariaLabel="Show unit label below hero gauge value"
          />
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Motion"
        hint="Smooth arc fill toward each live sample."
        titleIcon={<Timer className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed
      >
        <TRNFormField id={`${widget.id}-fill-smoothing`} label="Fill smoothing (ms)">
          <CourseMaintainerScrubNumberField
            ariaLabel="Hero radial gauge fill smoothing milliseconds"
            value={widget.fillSmoothingMs}
            min={0}
            max={5000}
            step={50}
            fractionDigits={0}
            defaultValue={HERO_RADIAL_GAUGE_DEFAULTS.fillSmoothingMs}
            onChange={(fillSmoothingMs) =>
              onPatch({ fillSmoothingMs: Math.max(0, Math.min(5000, Math.round(fillSmoothingMs))) })
            }
          />
        </TRNFormField>
        <TRNHintText tone="muted" className="mt-1.5">
          Higher values ease jittery telemetry. Use 0 to snap the arc to each sample.
        </TRNHintText>
      </CourseInspectorCard>
    </>
  );
}
