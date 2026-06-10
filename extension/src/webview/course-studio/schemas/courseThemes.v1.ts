import { z } from "zod";
import { cardBlockColorsSchema } from "./cardBlockColors";
import { markdownBlockColorsSchema } from "./markdownBlockColors";

export const cardThemePresetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  colors: cardBlockColorsSchema,
});

export const markdownThemePresetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  colors: markdownBlockColorsSchema,
});

export const courseThemesV1Schema = z.object({
  card: z.array(cardThemePresetSchema).optional(),
  markdown: z.array(markdownThemePresetSchema).optional(),
});

export type CardThemePresetV1 = z.infer<typeof cardThemePresetSchema>;
export type MarkdownThemePresetV1 = z.infer<typeof markdownThemePresetSchema>;
export type CourseThemesV1 = z.infer<typeof courseThemesV1Schema>;

export function slugifyCourseThemePresetId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "preset";
}

export function findCardThemePreset(
  themes: CourseThemesV1 | undefined,
  presetId: string | undefined,
): CardThemePresetV1 | undefined {
  if (themes?.card == null || presetId == null || presetId.length === 0) {
    return undefined;
  }
  return themes.card.find((entry) => entry.id === presetId);
}

export function findMarkdownThemePreset(
  themes: CourseThemesV1 | undefined,
  presetId: string | undefined,
): MarkdownThemePresetV1 | undefined {
  if (themes?.markdown == null || presetId == null || presetId.length === 0) {
    return undefined;
  }
  return themes.markdown.find((entry) => entry.id === presetId);
}
