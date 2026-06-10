import { z } from "zod";
import { create } from "zustand";
import { normalizeCourseBlockColorHex } from "./blockColorHex";
import {
  sensorTelemetryCardBlockColorsSchema,
  stripEmptySensorTelemetryCardBlockColors,
  type SensorTelemetryCardBlockColorKey,
  type SensorTelemetryCardBlockColors,
} from "./sensorTelemetryCardBlockColors";

export const SENSOR_TELEMETRY_CARD_BLOCK_COLORS_CLIPBOARD_KIND =
  "course-studio/sensor-telemetry-card-block-colors" as const;
export const SENSOR_TELEMETRY_CARD_BLOCK_COLORS_CLIPBOARD_VERSION = 1 as const;

const clipboardEnvelopeSchema = z.object({
  kind: z.literal(SENSOR_TELEMETRY_CARD_BLOCK_COLORS_CLIPBOARD_KIND),
  version: z.literal(SENSOR_TELEMETRY_CARD_BLOCK_COLORS_CLIPBOARD_VERSION),
  colors: sensorTelemetryCardBlockColorsSchema.optional(),
});

function cloneSensorTelemetryCardBlockColors(
  colors: SensorTelemetryCardBlockColors | undefined,
): SensorTelemetryCardBlockColors | undefined {
  const stripped = stripEmptySensorTelemetryCardBlockColors(colors);
  return stripped == null ? undefined : structuredClone(stripped);
}

export function serializeSensorTelemetryCardBlockColorsClipboard(
  colors: SensorTelemetryCardBlockColors | undefined,
): string {
  return JSON.stringify({
    kind: SENSOR_TELEMETRY_CARD_BLOCK_COLORS_CLIPBOARD_KIND,
    version: SENSOR_TELEMETRY_CARD_BLOCK_COLORS_CLIPBOARD_VERSION,
    colors: cloneSensorTelemetryCardBlockColors(colors),
  });
}

export function parseSensorTelemetryCardBlockColorsClipboard(
  raw: string,
): SensorTelemetryCardBlockColors | undefined | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = clipboardEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) {
      return null;
    }
    return cloneSensorTelemetryCardBlockColors(envelope.data.colors);
  } catch {
    return null;
  }
}

type SensorTelemetryCardBlockColorsClipboardStore = {
  hasClipboard: boolean;
  copiedColors: SensorTelemetryCardBlockColors | undefined;
  copyColors: (colors: SensorTelemetryCardBlockColors | undefined) => void;
  readCopiedColors: () => SensorTelemetryCardBlockColors | undefined;
};

export const useSensorTelemetryCardBlockColorsClipboardStore =
  create<SensorTelemetryCardBlockColorsClipboardStore>((set, get) => ({
    hasClipboard: false,
    copiedColors: undefined,
    copyColors: (colors) => {
      set({
        hasClipboard: true,
        copiedColors: cloneSensorTelemetryCardBlockColors(colors),
      });
    },
    readCopiedColors: () => cloneSensorTelemetryCardBlockColors(get().copiedColors),
  }));

export async function copySensorTelemetryCardBlockColors(
  colors: SensorTelemetryCardBlockColors | undefined,
): Promise<void> {
  useSensorTelemetryCardBlockColorsClipboardStore.getState().copyColors(colors);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText != null) {
    try {
      await navigator.clipboard.writeText(serializeSensorTelemetryCardBlockColorsClipboard(colors));
    } catch {
      // session clipboard still works
    }
  }
}

export async function pasteSensorTelemetryCardBlockColors(): Promise<
  SensorTelemetryCardBlockColors | undefined | null
> {
  if (useSensorTelemetryCardBlockColorsClipboardStore.getState().hasClipboard) {
    return useSensorTelemetryCardBlockColorsClipboardStore.getState().readCopiedColors();
  }
  if (typeof navigator === "undefined" || navigator.clipboard?.readText == null) {
    return null;
  }
  try {
    const raw = await navigator.clipboard.readText();
    return parseSensorTelemetryCardBlockColorsClipboard(raw);
  } catch {
    return null;
  }
}

export async function pasteSensorTelemetryCardBlockColorField(
  key: SensorTelemetryCardBlockColorKey,
): Promise<string | null> {
  const pasted = await pasteSensorTelemetryCardBlockColors();
  if (pasted == null) {
    return null;
  }
  const field = pasted[key];
  return field != null ? normalizeCourseBlockColorHex(field) : null;
}

export async function copySensorTelemetryCardBlockColorFieldHex(hex: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText != null) {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // ignore
    }
  }
}
