import { z } from "zod";
import type { TRNInteractiveCardShell } from "../../ui/TRN/trnInteractiveCardShell.js";
import {
  sensorTelemetryCardBlockColorsSchema,
  stripEmptySensorTelemetryCardBlockColors,
  type SensorTelemetryCardBlockColors,
} from "./sensorTelemetryCardBlockColors";

export const COURSE_SENSOR_TELEMETRY_CARD_SHELL_OPTIONS: ReadonlyArray<{
  value: TRNInteractiveCardShell;
  label: string;
}> = [
  { value: "solid", label: "Solid (Telemetry default)" },
  { value: "glass", label: "Glass" },
  { value: "solid-soft", label: "Solid soft" },
  { value: "inset", label: "Inset" },
  { value: "accent-emerald", label: "Accent emerald" },
  { value: "accent-cyan", label: "Accent cyan" },
  { value: "accent-amber", label: "Accent amber" },
  { value: "accent-rose", label: "Accent rose" },
  { value: "accent-violet", label: "Accent violet" },
];

export const courseSensorTelemetryCardShellSchema = z.enum([
  "solid",
  "glass",
  "solid-soft",
  "inset",
  "accent-emerald",
  "accent-cyan",
  "accent-amber",
  "accent-rose",
  "accent-violet",
]);

export const sensorTelemetryCardAppearanceSchema = z.object({
  shell: courseSensorTelemetryCardShellSchema.optional(),
  colors: sensorTelemetryCardBlockColorsSchema.optional(),
  showUpdateBadge: z.boolean().optional(),
  showDisplaySettings: z.boolean().optional(),
  defaultCollapsed: z.boolean().optional(),
});

export type SensorTelemetryCardAppearance = z.infer<typeof sensorTelemetryCardAppearanceSchema>;

export const SENSOR_TELEMETRY_CARD_APPEARANCE_DEFAULTS = {
  shell: "solid" as const,
  showUpdateBadge: true,
  showDisplaySettings: true,
  defaultCollapsed: false,
};

export function stripEmptySensorTelemetryCardAppearance(
  appearance: SensorTelemetryCardAppearance | undefined,
): SensorTelemetryCardAppearance | undefined {
  if (appearance == null) {
    return undefined;
  }
  const next: SensorTelemetryCardAppearance = {};
  if (appearance.shell != null) {
    next.shell = appearance.shell;
  }
  const colors = stripEmptySensorTelemetryCardBlockColors(appearance.colors);
  if (colors != null) {
    next.colors = colors;
  }
  if (appearance.showUpdateBadge === false) {
    next.showUpdateBadge = false;
  }
  if (appearance.showDisplaySettings === false) {
    next.showDisplaySettings = false;
  }
  if (appearance.defaultCollapsed === true) {
    next.defaultCollapsed = true;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function patchSensorTelemetryCardAppearance(
  appearance: SensorTelemetryCardAppearance | undefined,
  patch: Partial<SensorTelemetryCardAppearance>,
): SensorTelemetryCardAppearance | undefined {
  let nextColors = appearance?.colors;
  if ("colors" in patch) {
    nextColors =
      patch.colors === undefined
        ? undefined
        : stripEmptySensorTelemetryCardBlockColors({
            ...(appearance?.colors ?? {}),
            ...patch.colors,
          });
  }

  return stripEmptySensorTelemetryCardAppearance({
    ...(appearance ?? {}),
    ...patch,
    colors: nextColors,
  });
}

export function resolveSensorTelemetryCardEffectiveColors(
  blockAppearance: SensorTelemetryCardAppearance | undefined,
  pageColors: SensorTelemetryCardBlockColors | undefined,
): SensorTelemetryCardBlockColors | undefined {
  const merged: SensorTelemetryCardBlockColors = {
    ...(pageColors ?? {}),
    ...(blockAppearance?.colors ?? {}),
  };
  return stripEmptySensorTelemetryCardBlockColors(merged);
}

export function resolveSensorTelemetryCardEffectiveAppearance(
  blockAppearance: SensorTelemetryCardAppearance | undefined,
  pageColors: SensorTelemetryCardBlockColors | undefined,
): Required<
  Pick<
    SensorTelemetryCardAppearance,
    "shell" | "showUpdateBadge" | "showDisplaySettings" | "defaultCollapsed"
  >
> & {
  colors: SensorTelemetryCardBlockColors | undefined;
} {
  return {
    shell: blockAppearance?.shell ?? SENSOR_TELEMETRY_CARD_APPEARANCE_DEFAULTS.shell,
    showUpdateBadge:
      blockAppearance?.showUpdateBadge ??
      SENSOR_TELEMETRY_CARD_APPEARANCE_DEFAULTS.showUpdateBadge,
    showDisplaySettings:
      blockAppearance?.showDisplaySettings ??
      SENSOR_TELEMETRY_CARD_APPEARANCE_DEFAULTS.showDisplaySettings,
    defaultCollapsed:
      blockAppearance?.defaultCollapsed ??
      SENSOR_TELEMETRY_CARD_APPEARANCE_DEFAULTS.defaultCollapsed,
    colors: resolveSensorTelemetryCardEffectiveColors(blockAppearance, pageColors),
  };
}
