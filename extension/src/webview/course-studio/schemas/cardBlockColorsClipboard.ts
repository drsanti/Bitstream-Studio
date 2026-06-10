import { z } from "zod";
import { create } from "zustand";
import { normalizeCourseBlockColorHex } from "./blockColorHex";
import {
  cardBlockColorsSchema,
  stripEmptyCardBlockColors,
  type CardBlockColorKey,
  type CardBlockColors,
} from "./cardBlockColors";

export const CARD_BLOCK_COLORS_CLIPBOARD_KIND = "course-studio/card-block-colors" as const;
export const CARD_BLOCK_COLORS_CLIPBOARD_VERSION = 1 as const;

const clipboardEnvelopeSchema = z.object({
  kind: z.literal(CARD_BLOCK_COLORS_CLIPBOARD_KIND),
  version: z.literal(CARD_BLOCK_COLORS_CLIPBOARD_VERSION),
  colors: cardBlockColorsSchema.optional(),
});

function cloneCardBlockColors(colors: CardBlockColors | undefined): CardBlockColors | undefined {
  const stripped = stripEmptyCardBlockColors(colors);
  return stripped == null ? undefined : structuredClone(stripped);
}

export function serializeCardBlockColorsClipboard(colors: CardBlockColors | undefined): string {
  return JSON.stringify({
    kind: CARD_BLOCK_COLORS_CLIPBOARD_KIND,
    version: CARD_BLOCK_COLORS_CLIPBOARD_VERSION,
    colors: cloneCardBlockColors(colors),
  });
}

export function parseCardBlockColorsClipboard(raw: string): CardBlockColors | undefined | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = clipboardEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) {
      return null;
    }
    return cloneCardBlockColors(envelope.data.colors);
  } catch {
    return null;
  }
}

type CardBlockColorsClipboardStore = {
  hasClipboard: boolean;
  copiedColors: CardBlockColors | undefined;
  copyColors: (colors: CardBlockColors | undefined) => void;
  readCopiedColors: () => CardBlockColors | undefined;
};

export const useCardBlockColorsClipboardStore = create<CardBlockColorsClipboardStore>((set, get) => ({
  hasClipboard: false,
  copiedColors: undefined,
  copyColors: (colors) => {
    set({
      hasClipboard: true,
      copiedColors: cloneCardBlockColors(colors),
    });
  },
  readCopiedColors: () => cloneCardBlockColors(get().copiedColors),
}));

export async function copyCardBlockColors(colors: CardBlockColors | undefined): Promise<void> {
  useCardBlockColorsClipboardStore.getState().copyColors(colors);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText != null) {
    try {
      await navigator.clipboard.writeText(serializeCardBlockColorsClipboard(colors));
    } catch {
      // session clipboard still works
    }
  }
}

export async function pasteCardBlockColors(): Promise<CardBlockColors | undefined | null> {
  if (useCardBlockColorsClipboardStore.getState().hasClipboard) {
    return useCardBlockColorsClipboardStore.getState().readCopiedColors();
  }
  if (typeof navigator === "undefined" || navigator.clipboard?.readText == null) {
    return null;
  }
  try {
    const raw = await navigator.clipboard.readText();
    if (raw.trim().length === 0) {
      return null;
    }
    return parseCardBlockColorsClipboard(raw);
  } catch {
    return null;
  }
}

export async function copyCardBlockColorFieldHex(hex: string): Promise<boolean> {
  const normalized = normalizeCourseBlockColorHex(hex);
  if (normalized == null) {
    return false;
  }
  if (typeof navigator === "undefined" || navigator.clipboard?.writeText == null) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(normalized);
    return true;
  } catch {
    return false;
  }
}

export async function pasteCardBlockColorField(
  colorKey: CardBlockColorKey,
): Promise<string | null> {
  if (typeof navigator === "undefined" || navigator.clipboard?.readText == null) {
    return null;
  }
  let raw: string;
  try {
    raw = await navigator.clipboard.readText();
  } catch {
    return null;
  }
  const fromEnvelope = parseCardBlockColorsClipboard(raw);
  if (fromEnvelope !== null) {
    const field = fromEnvelope?.[colorKey];
    return field != null ? normalizeCourseBlockColorHex(field) : null;
  }
  return normalizeCourseBlockColorHex(raw);
}
