import { z } from "zod";
import type { CSSProperties } from "react";
import {
  courseBlockColorHexEquivalent,
  courseBlockColorHexSchema,
  normalizeCourseBlockColorHex,
} from "./blockColorHex";

export const sensorTelemetryCardBlockColorsSchema = z.object({
  background: courseBlockColorHexSchema.optional(),
  border: courseBlockColorHexSchema.optional(),
  title: courseBlockColorHexSchema.optional(),
  headerBackground: courseBlockColorHexSchema.optional(),
});

export type SensorTelemetryCardBlockColors = z.infer<
  typeof sensorTelemetryCardBlockColorsSchema
>;
export type SensorTelemetryCardBlockColorKey = keyof SensorTelemetryCardBlockColors;

/** Picker reference when unset; transparent border/header = inherit shell chrome. */
export const SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS: Record<
  SensorTelemetryCardBlockColorKey,
  string
> = {
  background: "#000000ad",
  border: "#00000000",
  title: "#f0f0f0",
  headerBackground: "#00000000",
};

export const SENSOR_TELEMETRY_CARD_BLOCK_COLOR_CSS_VARS: Record<
  SensorTelemetryCardBlockColorKey,
  string
> = {
  background: "--course-sensor-card-bg",
  border: "--course-sensor-card-border",
  title: "--course-sensor-card-title",
  headerBackground: "--course-sensor-card-header-bg",
};

export const SENSOR_TELEMETRY_CARD_BLOCK_COLOR_INSPECTOR_GROUPS: ReadonlyArray<{
  id: "chrome" | "header";
  title: string;
  rows: ReadonlyArray<{ key: SensorTelemetryCardBlockColorKey; label: string; hint?: string }>;
}> = [
  {
    id: "chrome",
    title: "Container",
    rows: [
      { key: "background", label: "Background" },
      { key: "border", label: "Border" },
    ],
  },
  {
    id: "header",
    title: "Header",
    rows: [
      { key: "headerBackground", label: "Background", hint: "Title row strip behind icon and badge." },
      { key: "title", label: "Title text" },
    ],
  },
];

export function stripEmptySensorTelemetryCardBlockColors(
  colors: SensorTelemetryCardBlockColors | undefined,
): SensorTelemetryCardBlockColors | undefined {
  if (colors == null) {
    return undefined;
  }
  const next: Partial<SensorTelemetryCardBlockColors> = {};
  for (const key of Object.keys(
    SENSOR_TELEMETRY_CARD_BLOCK_COLOR_CSS_VARS,
  ) as SensorTelemetryCardBlockColorKey[]) {
    const value = colors[key];
    if (value != null && value.length > 0) {
      next[key] = value;
    }
  }
  return Object.keys(next).length > 0 ? (next as SensorTelemetryCardBlockColors) : undefined;
}

export function patchSensorTelemetryCardBlockColor(
  colors: SensorTelemetryCardBlockColors | undefined,
  key: SensorTelemetryCardBlockColorKey,
  value: string | undefined,
): SensorTelemetryCardBlockColors | undefined {
  const normalized =
    value == null || value.length === 0 ? undefined : normalizeCourseBlockColorHex(value);
  const next: SensorTelemetryCardBlockColors = { ...(colors ?? {}) };
  if (normalized == null) {
    delete next[key];
  } else if (
    courseBlockColorHexEquivalent(
      normalized,
      SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS[key],
    )
  ) {
    delete next[key];
  } else {
    next[key] = normalized;
  }
  return stripEmptySensorTelemetryCardBlockColors(next);
}

export function stripSensorTelemetryCardBlockColorsMatchingThemeDefaults(
  colors: SensorTelemetryCardBlockColors | undefined,
): SensorTelemetryCardBlockColors | undefined {
  if (colors == null) {
    return undefined;
  }
  const next: SensorTelemetryCardBlockColors = { ...colors };
  for (const key of Object.keys(
    SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS,
  ) as SensorTelemetryCardBlockColorKey[]) {
    const value = next[key];
    if (
      value != null &&
      courseBlockColorHexEquivalent(value, SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS[key])
    ) {
      delete next[key];
    }
  }
  return stripEmptySensorTelemetryCardBlockColors(next);
}

export function sensorTelemetryCardBlockColorsToStyle(
  colors: SensorTelemetryCardBlockColors | undefined,
): CSSProperties | undefined {
  if (colors == null) {
    return undefined;
  }
  const style: Record<string, string> = {};
  for (const key of Object.keys(
    SENSOR_TELEMETRY_CARD_BLOCK_COLOR_CSS_VARS,
  ) as SensorTelemetryCardBlockColorKey[]) {
    const value = colors[key];
    if (value != null) {
      style[SENSOR_TELEMETRY_CARD_BLOCK_COLOR_CSS_VARS[key]] = value;
    }
  }
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}
