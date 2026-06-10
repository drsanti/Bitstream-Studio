import { z } from "zod";
import type { CSSProperties } from "react";
import { courseBlockColorHexSchema } from "./blockColorHex";

export const widgetBoardThemePresetIdSchema = z.enum([
  "ev-compact",
  "course-amber",
  "industrial",
  "telemetry-cyan",
  "sci-fi",
]);

export type WidgetBoardThemePresetId = z.infer<typeof widgetBoardThemePresetIdSchema>;

export const WIDGET_BOARD_THEME_PRESET_OPTIONS: ReadonlyArray<{
  value: WidgetBoardThemePresetId;
  label: string;
  hint: string;
}> = [
  {
    value: "ev-compact",
    label: "EV compact",
    hint: "Cyan and green mobility dashboard — subtle glow.",
  },
  {
    value: "course-amber",
    label: "Course amber",
    hint: "Warm accents aligned with Course Studio chrome.",
  },
  {
    value: "industrial",
    label: "Industrial",
    hint: "Flat zinc panels for lab and instrument widgets.",
  },
  {
    value: "telemetry-cyan",
    label: "Telemetry cyan",
    hint: "Cool clinical readouts with high legibility.",
  },
  {
    value: "sci-fi",
    label: "Sci-fi",
    hint: "Gradients, bloom, and holographic glow.",
  },
];

export const widgetBoardThemeTokensSchema = z.object({
  shellBg: courseBlockColorHexSchema,
  shellBorder: courseBlockColorHexSchema,
  shellRadiusPx: z.number().int().min(0).max(48),
  shellShadow: z.string().optional(),
  metaText: courseBlockColorHexSchema,
  captionText: courseBlockColorHexSchema,
  label: courseBlockColorHexSchema,
  value: courseBlockColorHexSchema,
  unit: courseBlockColorHexSchema,
  muted: courseBlockColorHexSchema,
  trackBg: courseBlockColorHexSchema,
  gradientFrom: courseBlockColorHexSchema,
  gradientTo: courseBlockColorHexSchema,
  gradientVia: courseBlockColorHexSchema.optional(),
  gaugeArcFrom: courseBlockColorHexSchema,
  gaugeArcTo: courseBlockColorHexSchema,
  gaugeArcVia: courseBlockColorHexSchema.optional(),
  gaugeHoleBg: courseBlockColorHexSchema,
  liveGlow: z.string().optional(),
  valueTextShadow: z.string().optional(),
  metricPanelBg: courseBlockColorHexSchema.optional(),
  metricPanelBorder: courseBlockColorHexSchema.optional(),
  staleOpacity: z.number().min(0).max(1).default(0.55),
});

export type WidgetBoardThemeTokensV1 = z.infer<typeof widgetBoardThemeTokensSchema>;

export const WIDGET_BOARD_THEME_CSS_VAR_KEYS = {
  shellBg: "--course-wb-shell-bg",
  shellBorder: "--course-wb-shell-border",
  shellRadiusPx: "--course-wb-shell-radius",
  shellShadow: "--course-wb-shell-shadow",
  metaText: "--course-wb-meta-text",
  captionText: "--course-wb-caption-text",
  label: "--course-wb-label",
  value: "--course-wb-value",
  unit: "--course-wb-unit",
  muted: "--course-wb-muted",
  trackBg: "--course-wb-track-bg",
  gradientFrom: "--course-wb-gradient-from",
  gradientTo: "--course-wb-gradient-to",
  gradientVia: "--course-wb-gradient-via",
  gaugeArcFrom: "--course-wb-gauge-arc-from",
  gaugeArcTo: "--course-wb-gauge-arc-to",
  gaugeArcVia: "--course-wb-gauge-arc-via",
  gaugeHoleBg: "--course-wb-gauge-hole-bg",
  liveGlow: "--course-wb-live-glow",
  valueTextShadow: "--course-wb-value-shadow",
  metricPanelBg: "--course-wb-metric-panel-bg",
  metricPanelBorder: "--course-wb-metric-panel-border",
  staleOpacity: "--course-wb-stale-opacity",
} as const;

const EV_COMPACT_THEME: WidgetBoardThemeTokensV1 = {
  shellBg: "#121b2b",
  shellBorder: "#42e8ff47",
  shellRadiusPx: 20,
  shellShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
  metaText: "#8ca4b8",
  captionText: "#8ca4b8",
  label: "#8ca4b8",
  value: "#eaf7ff",
  unit: "#8ca4b8",
  muted: "#8ca4b8",
  trackBg: "#ffffff14",
  gradientFrom: "#54ff9d",
  gradientTo: "#42e8ff",
  gaugeArcFrom: "#42e8ff",
  gaugeArcTo: "#5477ff",
  gaugeHoleBg: "#08111e",
  liveGlow: "0 0 16px rgba(66, 232, 255, 0.3)",
  metricPanelBg: "#ffffff0a",
  metricPanelBorder: "#ffffff14",
  staleOpacity: 0.55,
};

const COURSE_AMBER_THEME: WidgetBoardThemeTokensV1 = {
  shellBg: "#1c1917",
  shellBorder: "#f59e0b66",
  shellRadiusPx: 16,
  shellShadow: "0 8px 28px rgba(0, 0, 0, 0.32)",
  metaText: "#a8a29e",
  captionText: "#a8a29e",
  label: "#a8a29e",
  value: "#fafaf9",
  unit: "#a8a29e",
  muted: "#78716c",
  trackBg: "#ffffff12",
  gradientFrom: "#fbbf24",
  gradientTo: "#f59e0b",
  gaugeArcFrom: "#fbbf24",
  gaugeArcTo: "#ea580c",
  gaugeHoleBg: "#0c0a09",
  liveGlow: "0 0 12px rgba(245, 158, 11, 0.25)",
  metricPanelBg: "#ffffff08",
  metricPanelBorder: "#ffffff12",
  staleOpacity: 0.55,
};

const INDUSTRIAL_THEME: WidgetBoardThemeTokensV1 = {
  shellBg: "#18181b",
  shellBorder: "#3f3f46",
  shellRadiusPx: 12,
  metaText: "#71717a",
  captionText: "#71717a",
  label: "#71717a",
  value: "#fafafa",
  unit: "#a1a1aa",
  muted: "#71717a",
  trackBg: "#27272a",
  gradientFrom: "#a1a1aa",
  gradientTo: "#e4e4e7",
  gaugeArcFrom: "#71717a",
  gaugeArcTo: "#d4d4d8",
  gaugeHoleBg: "#09090b",
  metricPanelBg: "#27272a",
  metricPanelBorder: "#3f3f46",
  staleOpacity: 0.5,
};

const TELEMETRY_CYAN_THEME: WidgetBoardThemeTokensV1 = {
  shellBg: "#0f1419",
  shellBorder: "#42e8ff33",
  shellRadiusPx: 14,
  shellShadow: "0 10px 32px rgba(0, 0, 0, 0.28)",
  metaText: "#8ca4b8",
  captionText: "#8ca4b8",
  label: "#8ca4b8",
  value: "#eaf7ff",
  unit: "#8ca4b8",
  muted: "#64748b",
  trackBg: "#1e293b",
  gradientFrom: "#22d3ee",
  gradientTo: "#38bdf8",
  gaugeArcFrom: "#22d3ee",
  gaugeArcTo: "#0ea5e9",
  gaugeHoleBg: "#0b1220",
  liveGlow: "0 0 10px rgba(34, 211, 238, 0.2)",
  metricPanelBg: "#141c28",
  metricPanelBorder: "#1e293b",
  staleOpacity: 0.55,
};

const SCI_FI_THEME: WidgetBoardThemeTokensV1 = {
  shellBg: "#050810",
  shellBorder: "#8b5cf666",
  shellRadiusPx: 20,
  shellShadow:
    "0 0 24px rgba(66, 232, 255, 0.18), 0 0 48px rgba(139, 92, 246, 0.12), 0 12px 40px rgba(0, 0, 0, 0.45)",
  metaText: "#94a3b8",
  captionText: "#94a3b8",
  label: "#94a3b8",
  value: "#f8fafc",
  unit: "#67e8f9",
  muted: "#64748b",
  trackBg: "#ffffff0c",
  gradientFrom: "#a78bfa",
  gradientVia: "#42e8ff",
  gradientTo: "#54ff9d",
  gaugeArcFrom: "#42e8ff",
  gaugeArcVia: "#5477ff",
  gaugeArcTo: "#a78bfa",
  gaugeHoleBg: "#030712",
  liveGlow: "0 0 24px rgba(66, 232, 255, 0.45), 0 0 40px rgba(139, 92, 246, 0.2)",
  valueTextShadow: "0 0 12px rgba(66, 232, 255, 0.35)",
  metricPanelBg: "#ffffff06",
  metricPanelBorder: "#42e8ff22",
  staleOpacity: 0.5,
};

export const WIDGET_BOARD_THEME_PRESETS: Record<WidgetBoardThemePresetId, WidgetBoardThemeTokensV1> = {
  "ev-compact": EV_COMPACT_THEME,
  "course-amber": COURSE_AMBER_THEME,
  industrial: INDUSTRIAL_THEME,
  "telemetry-cyan": TELEMETRY_CYAN_THEME,
  "sci-fi": SCI_FI_THEME,
};

export function widgetBoardThemePresetTokens(
  presetId: WidgetBoardThemePresetId,
): WidgetBoardThemeTokensV1 {
  return { ...WIDGET_BOARD_THEME_PRESETS[presetId] };
}

export function resolveWidgetBoardThemeTokens(args: {
  presetId: WidgetBoardThemePresetId;
  overrides?: Partial<WidgetBoardThemeTokensV1>;
}): WidgetBoardThemeTokensV1 {
  const base = widgetBoardThemePresetTokens(args.presetId);
  if (args.overrides == null) {
    return base;
  }
  return { ...base, ...args.overrides };
}

export function widgetBoardThemeTokensToCssProperties(
  tokens: WidgetBoardThemeTokensV1,
): CSSProperties {
  const style: Record<string, string> = {
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.shellBg]: tokens.shellBg,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.shellBorder]: tokens.shellBorder,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.shellRadiusPx]: `${tokens.shellRadiusPx}px`,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.metaText]: tokens.metaText,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.captionText]: tokens.captionText,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.label]: tokens.label,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.value]: tokens.value,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.unit]: tokens.unit,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.muted]: tokens.muted,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.trackBg]: tokens.trackBg,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.gradientFrom]: tokens.gradientFrom,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.gradientTo]: tokens.gradientTo,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.gaugeArcFrom]: tokens.gaugeArcFrom,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.gaugeArcTo]: tokens.gaugeArcTo,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.gaugeHoleBg]: tokens.gaugeHoleBg,
    [WIDGET_BOARD_THEME_CSS_VAR_KEYS.staleOpacity]: String(tokens.staleOpacity),
  };

  if (tokens.shellShadow != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.shellShadow] = tokens.shellShadow;
  }
  if (tokens.gradientVia != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.gradientVia] = tokens.gradientVia;
  }
  if (tokens.gaugeArcVia != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.gaugeArcVia] = tokens.gaugeArcVia;
  }
  if (tokens.liveGlow != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.liveGlow] = tokens.liveGlow;
  }
  if (tokens.valueTextShadow != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.valueTextShadow] = tokens.valueTextShadow;
  }
  if (tokens.metricPanelBg != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.metricPanelBg] = tokens.metricPanelBg;
  }
  if (tokens.metricPanelBorder != null) {
    style[WIDGET_BOARD_THEME_CSS_VAR_KEYS.metricPanelBorder] = tokens.metricPanelBorder;
  }

  return style as CSSProperties;
}
