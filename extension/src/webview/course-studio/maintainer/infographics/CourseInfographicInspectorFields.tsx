import { Shapes } from "lucide-react";
import {
  INFOGRAPHIC_PRESET_OPTIONS,
  INFOGRAPHIC_SKIN_DEFAULTS,
  suggestInfographicPresetFromPath,
  type InfographicVisualPresetId,
} from "../../schemas/infographicVisualPreset.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import { CourseBlockColorRow } from "../inspector/CourseBlockColorRow";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";

export function CourseInfographicInspectorFields({
  idPrefix,
  visualPreset,
  configSource,
  bindingPath,
  onPatch,
}: {
  idPrefix: string;
  visualPreset: InfographicVisualPresetId;
  configSource: Record<string, unknown>;
  bindingPath?: string;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const suggested =
    bindingPath != null && bindingPath.length > 0
      ? suggestInfographicPresetFromPath(bindingPath)
      : undefined;
  const active = visualPreset !== "abstract";

  return (
    <CourseInspectorCard
      title="Infographic skin"
      hint="Semantic SVG visuals shared by dashboard widgets and widget board tiles."
      titleIcon={<Shapes className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2">
        <TRNFormField id={`${idPrefix}-visual-preset`} label="Visual preset">
          <TRNSelect
            value={visualPreset}
            ariaLabel="Infographic visual preset"
            variant="field"
            size="sm"
            options={[
              { value: "abstract", label: "Abstract (default)" },
              ...INFOGRAPHIC_PRESET_OPTIONS,
            ]}
            onValueChange={(value) => {
              if (typeof value === "string") {
                onPatch({ visualPreset: value });
              }
            }}
          />
        </TRNFormField>
        {suggested != null && suggested !== visualPreset ? (
          <TRNHintText tone="muted">
            Suggested for <strong>{bindingPath}</strong>: {suggested.replace(/-/g, " ")}.
          </TRNHintText>
        ) : null}

        {active ? (
          <>
            <TRNFormField id={`${idPrefix}-fill-smoothing`} label="Fill smoothing (ms)">
              <CourseMaintainerScrubNumberField
                ariaLabel="Infographic fill smoothing milliseconds"
                value={
                  typeof configSource.fillSmoothingMs === "number"
                    ? configSource.fillSmoothingMs
                    : INFOGRAPHIC_SKIN_DEFAULTS.fillSmoothingMs
                }
                min={0}
                max={5000}
                step={50}
                fractionDigits={0}
                defaultValue={INFOGRAPHIC_SKIN_DEFAULTS.fillSmoothingMs}
                onChange={(fillSmoothingMs) =>
                  onPatch({
                    fillSmoothingMs: Math.max(0, Math.min(5000, Math.round(fillSmoothingMs))),
                  })
                }
              />
            </TRNFormField>
            <CourseBlockColorRow
              label="Fill color"
              value={typeof configSource.fillColor === "string" ? configSource.fillColor : undefined}
              onChange={(fillColor) => onPatch({ fillColor })}
            />
            <CourseBlockColorRow
              label="Track color"
              value={typeof configSource.trackColor === "string" ? configSource.trackColor : undefined}
              onChange={(trackColor) => onPatch({ trackColor })}
            />

            {visualPreset === "thermometer-mercury" ? (
              <>
                <TRNFormField id={`${idPrefix}-tube-width`} label="Tube width (%)">
                  <CourseMaintainerScrubNumberField
                    ariaLabel="Thermometer tube width percent"
                    value={
                      typeof configSource.tubeWidthPercent === "number"
                        ? configSource.tubeWidthPercent
                        : INFOGRAPHIC_SKIN_DEFAULTS.tubeWidthPercent
                    }
                    min={10}
                    max={32}
                    step={1}
                    fractionDigits={0}
                    defaultValue={INFOGRAPHIC_SKIN_DEFAULTS.tubeWidthPercent}
                    onChange={(tubeWidthPercent) =>
                      onPatch({
                        tubeWidthPercent: Math.max(10, Math.min(32, Math.round(tubeWidthPercent))),
                      })
                    }
                  />
                </TRNFormField>
                <TRNFormField id={`${idPrefix}-bulb-size`} label="Bulb size (%)">
                  <CourseMaintainerScrubNumberField
                    ariaLabel="Thermometer bulb size percent"
                    value={
                      typeof configSource.bulbSizePercent === "number"
                        ? configSource.bulbSizePercent
                        : INFOGRAPHIC_SKIN_DEFAULTS.bulbSizePercent
                    }
                    min={18}
                    max={40}
                    step={1}
                    fractionDigits={0}
                    defaultValue={INFOGRAPHIC_SKIN_DEFAULTS.bulbSizePercent}
                    onChange={(bulbSizePercent) =>
                      onPatch({
                        bulbSizePercent: Math.max(18, Math.min(40, Math.round(bulbSizePercent))),
                      })
                    }
                  />
                </TRNFormField>
              </>
            ) : null}

            {visualPreset === "battery-segmented" ? (
              <TRNFormField id={`${idPrefix}-segment-count`} label="Segment count">
                <CourseMaintainerScrubNumberField
                  ariaLabel="Battery segment count"
                  value={
                    typeof configSource.segmentCount === "number"
                      ? configSource.segmentCount
                      : INFOGRAPHIC_SKIN_DEFAULTS.segmentCount
                  }
                  min={3}
                  max={8}
                  step={1}
                  fractionDigits={0}
                  defaultValue={INFOGRAPHIC_SKIN_DEFAULTS.segmentCount}
                  onChange={(segmentCount) =>
                    onPatch({
                      segmentCount: Math.max(3, Math.min(8, Math.round(segmentCount))),
                    })
                  }
                />
              </TRNFormField>
            ) : null}

            {visualPreset === "manometer-column" ? (
              <TRNInlineToggleRow
                label="Scale ticks"
                checked={
                  typeof configSource.showScaleTicks === "boolean"
                    ? configSource.showScaleTicks
                    : INFOGRAPHIC_SKIN_DEFAULTS.showScaleTicks
                }
                onCheckedChange={(showScaleTicks) => onPatch({ showScaleTicks })}
                ariaLabel="Show manometer scale ticks"
              />
            ) : null}

            {visualPreset === "compass-rose" ? (
              <>
                <CourseBlockColorRow
                  label="Needle color"
                  value={
                    typeof configSource.needleColor === "string" ? configSource.needleColor : undefined
                  }
                  onChange={(needleColor) => onPatch({ needleColor })}
                />
                <TRNInlineToggleRow
                  label="Cardinal labels"
                  checked={
                    typeof configSource.showCardinals === "boolean"
                      ? configSource.showCardinals
                      : INFOGRAPHIC_SKIN_DEFAULTS.showCardinals
                  }
                  onCheckedChange={(showCardinals) => onPatch({ showCardinals })}
                  ariaLabel="Show compass cardinal labels"
                />
                <TRNInlineToggleRow
                  label="Digital heading"
                  checked={
                    typeof configSource.showDigitalHeading === "boolean"
                      ? configSource.showDigitalHeading
                      : INFOGRAPHIC_SKIN_DEFAULTS.showDigitalHeading
                  }
                  onCheckedChange={(showDigitalHeading) => onPatch({ showDigitalHeading })}
                  ariaLabel="Show digital heading below compass"
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </CourseInspectorCard>
  );
}
