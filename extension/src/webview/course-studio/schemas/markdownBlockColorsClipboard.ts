import { z } from "zod";
import { create } from "zustand";
import {
  markdownBlockColorsSchema,
  normalizeMarkdownBlockColorHex,
  stripEmptyMarkdownBlockColors,
  type MarkdownBlockColorKey,
  type MarkdownBlockColors,
} from "./markdownBlockColors";

export const MARKDOWN_BLOCK_COLORS_CLIPBOARD_KIND = "course-studio/markdown-block-colors" as const;
export const MARKDOWN_BLOCK_COLORS_CLIPBOARD_VERSION = 1 as const;

const clipboardEnvelopeSchema = z.object({
  kind: z.literal(MARKDOWN_BLOCK_COLORS_CLIPBOARD_KIND),
  version: z.literal(MARKDOWN_BLOCK_COLORS_CLIPBOARD_VERSION),
  colors: markdownBlockColorsSchema.optional(),
});

export type MarkdownBlockColorsClipboardEnvelope = z.infer<typeof clipboardEnvelopeSchema>;

export function cloneMarkdownBlockColors(
  colors: MarkdownBlockColors | undefined,
): MarkdownBlockColors | undefined {
  const stripped = stripEmptyMarkdownBlockColors(colors);
  return stripped == null ? undefined : structuredClone(stripped);
}

export function serializeMarkdownBlockColorsClipboard(
  colors: MarkdownBlockColors | undefined,
): string {
  const envelope: MarkdownBlockColorsClipboardEnvelope = {
    kind: MARKDOWN_BLOCK_COLORS_CLIPBOARD_KIND,
    version: MARKDOWN_BLOCK_COLORS_CLIPBOARD_VERSION,
    colors: cloneMarkdownBlockColors(colors),
  };
  return JSON.stringify(envelope);
}

/** `null` = invalid payload; `undefined` = valid clear-to-theme paste. */
export function parseMarkdownBlockColorsClipboard(
  raw: string,
): MarkdownBlockColors | undefined | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = clipboardEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) {
      return null;
    }
    return cloneMarkdownBlockColors(envelope.data.colors);
  } catch {
    return null;
  }
}

export async function writeMarkdownBlockColorsToSystemClipboard(
  colors: MarkdownBlockColors | undefined,
): Promise<boolean> {
  if (typeof navigator === "undefined" || navigator.clipboard?.writeText == null) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(serializeMarkdownBlockColorsClipboard(colors));
    return true;
  } catch {
    return false;
  }
}

export async function readMarkdownBlockColorsFromSystemClipboard(): Promise<
  MarkdownBlockColors | undefined | null
> {
  if (typeof navigator === "undefined" || navigator.clipboard?.readText == null) {
    return null;
  }
  try {
    const raw = await navigator.clipboard.readText();
    if (raw.trim().length === 0) {
      return null;
    }
    return parseMarkdownBlockColorsClipboard(raw);
  } catch {
    return null;
  }
}

type MarkdownBlockColorsClipboardStore = {
  hasClipboard: boolean;
  copiedColors: MarkdownBlockColors | undefined;
  copyColors: (colors: MarkdownBlockColors | undefined) => void;
  readCopiedColors: () => MarkdownBlockColors | undefined;
};

export const useMarkdownBlockColorsClipboardStore = create<MarkdownBlockColorsClipboardStore>(
  (set, get) => ({
    hasClipboard: false,
    copiedColors: undefined,
    copyColors: (colors) => {
      set({
        hasClipboard: true,
        copiedColors: cloneMarkdownBlockColors(colors),
      });
    },
    readCopiedColors: () => cloneMarkdownBlockColors(get().copiedColors),
  }),
);

export async function copyMarkdownBlockColors(colors: MarkdownBlockColors | undefined): Promise<void> {
  useMarkdownBlockColorsClipboardStore.getState().copyColors(colors);
  await writeMarkdownBlockColorsToSystemClipboard(colors);
}

export async function pasteMarkdownBlockColors(): Promise<
  MarkdownBlockColors | undefined | null
> {
  const fromSession = useMarkdownBlockColorsClipboardStore.getState().readCopiedColors();
  if (useMarkdownBlockColorsClipboardStore.getState().hasClipboard) {
    return fromSession;
  }
  return readMarkdownBlockColorsFromSystemClipboard();
}

/** Parse clipboard text for a single color field (plain hex or full colors envelope). */
export function parseMarkdownBlockColorFieldPaste(
  raw: string,
  colorKey: MarkdownBlockColorKey,
): string | null {
  if (raw.trim().length === 0) {
    return null;
  }

  const fromEnvelope = parseMarkdownBlockColorsClipboard(raw);
  if (fromEnvelope !== null) {
    const field = fromEnvelope?.[colorKey];
    if (field == null) {
      return null;
    }
    return normalizeMarkdownBlockColorHex(field);
  }

  return normalizeMarkdownBlockColorHex(raw);
}

export async function copyMarkdownBlockColorFieldHex(hex: string): Promise<boolean> {
  const normalized = normalizeMarkdownBlockColorHex(hex);
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

/** Paste a single color field from plain hex or a full markdown-colors clipboard envelope. */
export async function pasteMarkdownBlockColorField(
  colorKey: MarkdownBlockColorKey,
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

  return parseMarkdownBlockColorFieldPaste(raw, colorKey);
}
