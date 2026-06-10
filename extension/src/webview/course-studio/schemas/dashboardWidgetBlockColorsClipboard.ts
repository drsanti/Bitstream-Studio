import { z } from "zod";
import { create } from "zustand";
import { normalizeCourseBlockColorHex } from "./blockColorHex";
import {
  dashboardWidgetBlockColorsSchema,
  stripEmptyDashboardWidgetBlockColors,
  type DashboardWidgetBlockColorKey,
  type DashboardWidgetBlockColors,
} from "./dashboardWidgetBlockColors";

export const DASHBOARD_WIDGET_BLOCK_COLORS_CLIPBOARD_KIND =
  "course-studio/dashboard-widget-block-colors" as const;
export const DASHBOARD_WIDGET_BLOCK_COLORS_CLIPBOARD_VERSION = 1 as const;

const clipboardEnvelopeSchema = z.object({
  kind: z.literal(DASHBOARD_WIDGET_BLOCK_COLORS_CLIPBOARD_KIND),
  version: z.literal(DASHBOARD_WIDGET_BLOCK_COLORS_CLIPBOARD_VERSION),
  colors: dashboardWidgetBlockColorsSchema.optional(),
});

function cloneDashboardWidgetBlockColors(
  colors: DashboardWidgetBlockColors | undefined,
): DashboardWidgetBlockColors | undefined {
  const stripped = stripEmptyDashboardWidgetBlockColors(colors);
  return stripped == null ? undefined : structuredClone(stripped);
}

export function serializeDashboardWidgetBlockColorsClipboard(
  colors: DashboardWidgetBlockColors | undefined,
): string {
  return JSON.stringify({
    kind: DASHBOARD_WIDGET_BLOCK_COLORS_CLIPBOARD_KIND,
    version: DASHBOARD_WIDGET_BLOCK_COLORS_CLIPBOARD_VERSION,
    colors: cloneDashboardWidgetBlockColors(colors),
  });
}

export function parseDashboardWidgetBlockColorsClipboard(
  raw: string,
): DashboardWidgetBlockColors | undefined | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = clipboardEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) {
      return null;
    }
    return cloneDashboardWidgetBlockColors(envelope.data.colors);
  } catch {
    return null;
  }
}

type DashboardWidgetBlockColorsClipboardStore = {
  hasClipboard: boolean;
  copiedColors: DashboardWidgetBlockColors | undefined;
  copyColors: (colors: DashboardWidgetBlockColors | undefined) => void;
  readCopiedColors: () => DashboardWidgetBlockColors | undefined;
};

export const useDashboardWidgetBlockColorsClipboardStore =
  create<DashboardWidgetBlockColorsClipboardStore>((set, get) => ({
    hasClipboard: false,
    copiedColors: undefined,
    copyColors: (colors) => {
      set({
        hasClipboard: true,
        copiedColors: cloneDashboardWidgetBlockColors(colors),
      });
    },
    readCopiedColors: () => cloneDashboardWidgetBlockColors(get().copiedColors),
  }));

export async function copyDashboardWidgetBlockColors(
  colors: DashboardWidgetBlockColors | undefined,
): Promise<void> {
  useDashboardWidgetBlockColorsClipboardStore.getState().copyColors(colors);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText != null) {
    try {
      await navigator.clipboard.writeText(serializeDashboardWidgetBlockColorsClipboard(colors));
    } catch {
      // session clipboard still works
    }
  }
}

export async function pasteDashboardWidgetBlockColors(): Promise<
  DashboardWidgetBlockColors | undefined | null
> {
  if (useDashboardWidgetBlockColorsClipboardStore.getState().hasClipboard) {
    return useDashboardWidgetBlockColorsClipboardStore.getState().readCopiedColors();
  }
  if (typeof navigator === "undefined" || navigator.clipboard?.readText == null) {
    return null;
  }
  try {
    const raw = await navigator.clipboard.readText();
    return parseDashboardWidgetBlockColorsClipboard(raw);
  } catch {
    return null;
  }
}

export async function pasteDashboardWidgetBlockColorField(
  key: DashboardWidgetBlockColorKey,
): Promise<string | null> {
  const pasted = await pasteDashboardWidgetBlockColors();
  if (pasted == null) {
    return null;
  }
  const field = pasted[key];
  return field != null ? normalizeCourseBlockColorHex(field) : null;
}

export async function copyDashboardWidgetBlockColorFieldHex(hex: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText != null) {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // ignore
    }
  }
}
