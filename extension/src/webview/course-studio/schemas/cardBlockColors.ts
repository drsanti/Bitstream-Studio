import { z } from "zod";
import type { CSSProperties } from "react";
import { PRESENTATION_DARK_TEXT_COLORS } from "../../presentation/design/presentationTextColors";
import {
  courseBlockColorHexSchema,
  normalizeCourseBlockColorHex,
} from "./blockColorHex";

export const cardBlockColorsSchema = z.object({
  background: courseBlockColorHexSchema.optional(),
  border: courseBlockColorHexSchema.optional(),
  title: courseBlockColorHexSchema.optional(),
  icon: courseBlockColorHexSchema.optional(),
  body: courseBlockColorHexSchema.optional(),
});

export type CardBlockColors = z.infer<typeof cardBlockColorsSchema>;
export type CardBlockColorKey = keyof CardBlockColors;

export const CARD_BLOCK_COLOR_THEME_DEFAULTS: Record<CardBlockColorKey, string> = {
  background: "#18181b",
  border: "#3f3f46",
  title: "#fafafa",
  icon: "#fafafa",
  body: PRESENTATION_DARK_TEXT_COLORS.secondary,
};

export const CARD_BLOCK_COLOR_CSS_VARS: Record<CardBlockColorKey, string> = {
  background: "--course-card-bg",
  border: "--course-card-border",
  title: "--course-card-title",
  icon: "--course-card-icon",
  body: "--course-card-body",
};

export const CARD_BLOCK_COLOR_INSPECTOR_GROUPS: ReadonlyArray<{
  id: "chrome" | "typography";
  title: string;
  rows: ReadonlyArray<{ key: CardBlockColorKey; label: string }>;
}> = [
  {
    id: "chrome",
    title: "Chrome",
    rows: [
      { key: "background", label: "Background" },
      { key: "border", label: "Border" },
    ],
  },
  {
    id: "typography",
    title: "Typography",
    rows: [
      { key: "title", label: "Title" },
      { key: "icon", label: "Prefix icon" },
      { key: "body", label: "Body" },
    ],
  },
];

export function stripEmptyCardBlockColors(
  colors: CardBlockColors | undefined,
): CardBlockColors | undefined {
  if (colors == null) {
    return undefined;
  }
  const next: Partial<CardBlockColors> = {};
  for (const key of Object.keys(CARD_BLOCK_COLOR_CSS_VARS) as CardBlockColorKey[]) {
    const value = colors[key];
    if (value != null && value.length > 0) {
      next[key] = value;
    }
  }
  return Object.keys(next).length > 0 ? (next as CardBlockColors) : undefined;
}

export function patchCardBlockColor(
  colors: CardBlockColors | undefined,
  key: CardBlockColorKey,
  value: string | undefined,
): CardBlockColors | undefined {
  const normalized =
    value == null || value.length === 0 ? undefined : normalizeCourseBlockColorHex(value);
  const next: CardBlockColors = { ...(colors ?? {}) };
  if (normalized == null) {
    delete next[key];
  } else {
    next[key] = normalized;
  }
  return stripEmptyCardBlockColors(next);
}

export function cardBlockColorsToStyle(
  colors: CardBlockColors | undefined,
): CSSProperties | undefined {
  if (colors == null) {
    return undefined;
  }
  const style: Record<string, string> = {};
  for (const key of Object.keys(CARD_BLOCK_COLOR_CSS_VARS) as CardBlockColorKey[]) {
    const value = colors[key];
    if (value != null) {
      style[CARD_BLOCK_COLOR_CSS_VARS[key]] = value;
    }
  }
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}
