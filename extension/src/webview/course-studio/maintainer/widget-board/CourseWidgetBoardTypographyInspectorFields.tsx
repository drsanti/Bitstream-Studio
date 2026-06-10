import { Type } from "lucide-react";
import type { PageBlockV1 } from "../../schemas/page.v1";
import {
  WIDGET_BOARD_TYPOGRAPHY_DEFAULTS,
  type WidgetBoardEntryV1,
  type WidgetBoardWidgetKind,
  type WidgetBoardWidgetTypographyV1,
} from "../../schemas/widgetBoard.v1";
import {
  resolveWidgetBoardThemeTokens,
  type WidgetBoardThemeTokensV1,
} from "../../schemas/widgetBoardTheme.v1";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "../CourseInspectorCard";
import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "../CourseInspectorFieldGrid";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";
import { CourseBlockColorRow } from "../inspector/CourseBlockColorRow";

function patchTypography(
  current: WidgetBoardWidgetTypographyV1 | undefined,
  patch: Partial<{
    [K in keyof WidgetBoardWidgetTypographyV1]: WidgetBoardWidgetTypographyV1[K] | undefined;
  }>,
): WidgetBoardWidgetTypographyV1 | undefined {
  const next: WidgetBoardWidgetTypographyV1 = { ...current };
  for (const [key, value] of Object.entries(patch) as [
    keyof WidgetBoardWidgetTypographyV1,
    WidgetBoardWidgetTypographyV1[keyof WidgetBoardWidgetTypographyV1] | undefined,
  ][]) {
    if (value == null) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function typographyDefaultsForKind(kind: WidgetBoardWidgetKind) {
  switch (kind) {
    case "metric-bar":
      return WIDGET_BOARD_TYPOGRAPHY_DEFAULTS.metricBar;
    case "hero-radial-gauge":
      return WIDGET_BOARD_TYPOGRAPHY_DEFAULTS.heroRadialGauge;
    case "numeric-readout":
      return WIDGET_BOARD_TYPOGRAPHY_DEFAULTS.numericReadout;
    case "vertical-bar":
      return WIDGET_BOARD_TYPOGRAPHY_DEFAULTS.verticalBar;
    case "status-pill":
      return WIDGET_BOARD_TYPOGRAPHY_DEFAULTS.statusPill;
    case "led-indicator":
      return WIDGET_BOARD_TYPOGRAPHY_DEFAULTS.ledIndicator;
  }
}

export function CourseWidgetBoardTypographyInspectorFields({
  block,
  widget,
  onPatchTypography,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
  widget: WidgetBoardEntryV1;
  onPatchTypography: (typography: WidgetBoardWidgetTypographyV1 | undefined) => void;
}) {
  const appearance = block.appearance ?? { themePresetId: "ev-compact" as const };
  const theme: WidgetBoardThemeTokensV1 = resolveWidgetBoardThemeTokens({
    presetId: appearance.themePresetId ?? "ev-compact",
    overrides: appearance.overrides,
  });
  const typography = widget.typography;
  const defaults = typographyDefaultsForKind(widget.kind);
  const showUnitFields =
    widget.kind === "metric-bar" ||
    widget.kind === "hero-radial-gauge" ||
    widget.kind === "numeric-readout" ||
    widget.kind === "vertical-bar";
  const valueLabel =
    widget.kind === "status-pill" ? "Pill text size" : "Value size";

  const patch = (next: Partial<WidgetBoardWidgetTypographyV1>) => {
    onPatchTypography(patchTypography(typography, next));
  };

  return (
    <CourseInspectorCard
      title="Typography"
      hint="Override label, value, and unit size or color. Unset fields use the board theme."
      titleIcon={<Type className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed
    >
      <div className="flex flex-col gap-2">
        <CourseInspectorFieldGrid>
          <CourseInspectorFieldGridLabels
            left={{ label: "Label size" }}
            right={{ label: valueLabel }}
          />
          <CourseInspectorFieldGridControls
            left={
              <CourseMaintainerScrubNumberField
                ariaLabel="Widget label font size"
                value={typography?.labelFontSizePx ?? defaults.labelFontSizePx}
                step={1}
                min={8}
                max={32}
                fractionDigits={0}
                defaultValue={defaults.labelFontSizePx}
                onChange={(labelFontSizePx) =>
                  patch({ labelFontSizePx: Math.round(labelFontSizePx) })
                }
              />
            }
            right={
              <CourseMaintainerScrubNumberField
                ariaLabel="Widget value font size"
                value={typography?.valueFontSizePx ?? defaults.valueFontSizePx}
                step={1}
                min={10}
                max={72}
                fractionDigits={0}
                defaultValue={defaults.valueFontSizePx}
                onChange={(valueFontSizePx) =>
                  patch({ valueFontSizePx: Math.round(valueFontSizePx) })
                }
              />
            }
          />
        </CourseInspectorFieldGrid>
        <CourseBlockColorRow
          label="Label color"
          value={typography?.labelColor}
          defaultHex={theme.label}
          onChange={(labelColor) => patch({ labelColor })}
        />
        {(widget.kind === "status-pill" || widget.kind === "led-indicator") ? null : (
          <CourseBlockColorRow
            label="Value color"
            value={typography?.valueColor}
            defaultHex={theme.value}
            onChange={(valueColor) => patch({ valueColor })}
          />
        )}

        {showUnitFields ? (
          <>
            <TRNFormField id={`${widget.id}-unit-size`} label="Unit size">
              <CourseMaintainerScrubNumberField
                ariaLabel="Widget unit font size"
                value={typography?.unitFontSizePx ?? defaults.unitFontSizePx}
                step={1}
                min={8}
                max={32}
                fractionDigits={0}
                defaultValue={defaults.unitFontSizePx}
                onChange={(unitFontSizePx) =>
                  patch({ unitFontSizePx: Math.round(unitFontSizePx) })
                }
              />
            </TRNFormField>
            <CourseBlockColorRow
              label="Unit color"
              value={typography?.unitColor}
              defaultHex={theme.unit}
              onChange={(unitColor) => patch({ unitColor })}
            />
          </>
        ) : null}
      </div>
    </CourseInspectorCard>
  );
}
