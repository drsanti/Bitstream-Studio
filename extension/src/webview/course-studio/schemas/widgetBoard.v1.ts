import { z } from "zod";
import {
  heroRadialGaugeArcCapSchema,
  heroRadialGaugeArcPresetSchema,
  heroRadialGaugeZoneTintSchema,
} from "../ui/catalog/widget-board/heroRadialGaugeConfig";
import { courseBlockColorHexSchema } from "./blockColorHex";
import { diagramBindingSchema } from "./diagramBindingSchemas";
import {
  widgetBoardThemePresetIdSchema,
  widgetBoardThemeTokensSchema,
  type WidgetBoardThemePresetId,
} from "./widgetBoardTheme.v1";

export const widgetBoardWidgetKindSchema = z.enum(["metric-bar", "hero-radial-gauge"]);

export type WidgetBoardWidgetKind = z.infer<typeof widgetBoardWidgetKindSchema>;

const widgetBoardInnerGridSchema = z.object({
  columns: z.number().int().min(1).max(24).default(6),
  rowHeightPx: z.number().int().min(16).max(120).default(40),
  gapPx: z.number().int().min(0).max(32).default(8),
  paddingPx: z.number().int().min(0).max(64).default(16),
});

export type WidgetBoardInnerGridV1 = z.infer<typeof widgetBoardInnerGridSchema>;

const widgetBoardAppearanceSchema = z.object({
  themePresetId: widgetBoardThemePresetIdSchema.default("ev-compact"),
  overrides: widgetBoardThemeTokensSchema.partial().optional(),
  metaLine: z.string().optional(),
  caption: z.string().optional(),
  showMetaLine: z.boolean().optional(),
  showCaption: z.boolean().optional(),
});

export type WidgetBoardAppearanceV1 = z.infer<typeof widgetBoardAppearanceSchema>;

const widgetBoardPlacementSchema = z.object({
  column: z.number().int().min(1).max(24),
  row: z.number().int().min(1).max(200),
  columnSpan: z.number().int().min(1).max(24),
  rowSpan: z.number().int().min(1).max(200),
});

/** Per-widget label / value / unit typography overrides (theme defaults when unset). */
export const widgetBoardWidgetTypographySchema = z.object({
  labelFontSizePx: z.number().int().min(8).max(32).optional(),
  labelColor: courseBlockColorHexSchema.optional(),
  valueFontSizePx: z.number().int().min(10).max(72).optional(),
  valueColor: courseBlockColorHexSchema.optional(),
  unitFontSizePx: z.number().int().min(8).max(32).optional(),
  unitColor: courseBlockColorHexSchema.optional(),
});

export type WidgetBoardWidgetTypographyV1 = z.infer<typeof widgetBoardWidgetTypographySchema>;

export const WIDGET_BOARD_TYPOGRAPHY_DEFAULTS = {
  metricBar: {
    labelFontSizePx: 10,
    valueFontSizePx: 18,
    unitFontSizePx: 13,
  },
  heroRadialGauge: {
    labelFontSizePx: 10,
    valueFontSizePx: 42,
    unitFontSizePx: 11,
  },
} as const;

const metricBarWidgetSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("metric-bar"),
  placement: widgetBoardPlacementSchema,
  label: z.string().default("Value"),
  binding: diagramBindingSchema.optional(),
  min: z.number().default(0),
  max: z.number().default(100),
  decimals: z.number().int().min(0).max(6).default(0),
  /** Shown when live binding has no sample (maintainer preview / decorative). */
  demoValue: z.number().optional(),
  typography: widgetBoardWidgetTypographySchema.optional(),
});

const heroRadialGaugeWidgetSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("hero-radial-gauge"),
  placement: widgetBoardPlacementSchema,
  label: z.string().optional(),
  binding: diagramBindingSchema.optional(),
  min: z.number().default(0),
  max: z.number().default(180),
  decimals: z.number().int().min(0).max(6).default(0),
  unit: z.string().optional(),
  demoValue: z.number().optional(),
  heroArcPreset: heroRadialGaugeArcPresetSchema.default("hero140"),
  showValue: z.boolean().default(true),
  showUnit: z.boolean().default(true),
  fillSmoothingMs: z.number().int().min(0).max(5000).default(0),
  holeSizePercent: z.number().int().min(8).max(20).default(10),
  zoneTint: heroRadialGaugeZoneTintSchema.default("off"),
  showGlow: z.boolean().default(true),
  arcCap: heroRadialGaugeArcCapSchema.default("round"),
  typography: widgetBoardWidgetTypographySchema.optional(),
});

export { heroRadialGaugeArcPresetSchema };
export type { HeroRadialGaugeArcPresetId } from "../ui/catalog/widget-board/heroRadialGaugeConfig";

export const widgetBoardEntrySchema = z.discriminatedUnion("kind", [
  metricBarWidgetSchema,
  heroRadialGaugeWidgetSchema,
]);

export type WidgetBoardEntryV1 = z.infer<typeof widgetBoardEntrySchema>;
export type WidgetBoardMetricBarV1 = Extract<WidgetBoardEntryV1, { kind: "metric-bar" }>;
export type WidgetBoardHeroRadialGaugeV1 = Extract<
  WidgetBoardEntryV1,
  { kind: "hero-radial-gauge" }
>;

export const WIDGET_BOARD_WIDGET_MIN_SPAN: Record<
  WidgetBoardWidgetKind,
  { columnSpan: number; rowSpan: number }
> = {
  "metric-bar": { columnSpan: 2, rowSpan: 2 },
  "hero-radial-gauge": { columnSpan: 3, rowSpan: 3 },
};

export const WIDGET_BOARD_DEFAULT_INNER_GRID: WidgetBoardInnerGridV1 = {
  columns: 6,
  rowHeightPx: 48,
  gapPx: 8,
  paddingPx: 16,
};

export function createEvCompactWidgetBoardWidgets(): WidgetBoardEntryV1[] {
  return [
    {
      id: "power",
      kind: "metric-bar",
      placement: { column: 1, row: 1, columnSpan: 3, rowSpan: 2 },
      label: "Power",
      min: 0,
      max: 250,
      decimals: 0,
      demoValue: 192,
    },
    {
      id: "battery",
      kind: "metric-bar",
      placement: { column: 1, row: 3, columnSpan: 3, rowSpan: 2 },
      label: "Battery",
      min: 0,
      max: 100,
      decimals: 0,
      demoValue: 78,
    },
    {
      id: "speed",
      kind: "hero-radial-gauge",
      placement: { column: 4, row: 1, columnSpan: 3, rowSpan: 4 },
      label: "Speed",
      min: 0,
      max: 180,
      decimals: 0,
      unit: "km/h",
      demoValue: 90,
      heroArcPreset: "hero140",
      showValue: true,
      showUnit: true,
      fillSmoothingMs: 0,
      holeSizePercent: 10,
      zoneTint: "off",
      showGlow: true,
      arcCap: "round",
    },
  ];
}

export function defaultWidgetBoardAppearance(
  themePresetId: WidgetBoardThemePresetId = "ev-compact",
): WidgetBoardAppearanceV1 {
  return {
    themePresetId,
    showMetaLine: true,
    metaLine: "Decorative · no telemetry",
    caption:
      "Compact EV hero widget board. Select widgets in the editor, bind paths in the Inspector, or use demo values.",
  };
}

export const widgetBoardInnerGridSchemaExport = widgetBoardInnerGridSchema;
export const widgetBoardAppearanceSchemaExport = widgetBoardAppearanceSchema;
