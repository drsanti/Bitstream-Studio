/**
 * Global Course Studio document colors — applied to every book unless a page/block overrides.
 *
 * Layering (first match wins per field):
 * 1. Global document preset (this file)
 * 2. Course theme preset (when page `*ThemePresetId` is set)
 * 3. Page `meta.*Colors`
 * 4. Block `colors` (maintainer inspector — user override; reset clears field)
 *
 * New topics/pages should use `COURSE_STUDIO_DEFAULT_PAGE_THEME_META` so they inherit
 * the global preset without baking hex into block JSON.
 */
import {
  COURSE_MARKDOWN_DEFAULT_CODE_SYNTAX_THEME,
  PRESENTATION_DARK_TEXT_COLORS,
} from "../../presentation/design/presentationTextColors";
import type { CourseV1 } from "./course.v1";
import {
  CARD_BLOCK_COLOR_THEME_DEFAULTS,
  type CardBlockColors,
} from "./cardBlockColors";
import {
  COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
} from "./courseLiveBindingDefaults";
import type {
  CardThemePresetV1,
  CourseThemesV1,
  MarkdownThemePresetV1,
} from "./courseThemes.v1";
import {
  MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
  type MarkdownBlockColors,
} from "./markdownBlockColors";
import type { PageMetaV1 } from "./pageMeta";

/** Shared preset id for markdown + card global document theme. */
export const COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID = "global-document";

export const COURSE_STUDIO_GLOBAL_MARKDOWN_PRESET: MarkdownThemePresetV1 = {
  id: COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID,
  title: "Document (global)",
  colors: {
    ...MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
    codeSyntaxTheme: COURSE_MARKDOWN_DEFAULT_CODE_SYNTAX_THEME,
  },
};

export const COURSE_STUDIO_GLOBAL_CARD_PRESET: CardThemePresetV1 = {
  id: COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID,
  title: "Document (global)",
  colors: { ...CARD_BLOCK_COLOR_THEME_DEFAULTS },
};

export const COURSE_STUDIO_GLOBAL_THEMES: CourseThemesV1 = {
  markdown: [COURSE_STUDIO_GLOBAL_MARKDOWN_PRESET],
  card: [COURSE_STUDIO_GLOBAL_CARD_PRESET],
};

/** Page meta for new topics — references global preset; blocks stay color-free until overridden. */
export const COURSE_STUDIO_DEFAULT_PAGE_THEME_META: Pick<
  PageMetaV1,
  "markdownThemePresetId" | "cardThemePresetId"
> = {
  markdownThemePresetId: COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID,
  cardThemePresetId: COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID,
};

/** Live numeric widget zones for new dashboard-widget blocks (blue-white readout). */
export const COURSE_STUDIO_GLOBAL_DASHBOARD_TEXT_WIDGET_STYLE = {
  ...COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
} as const;

export const COURSE_STUDIO_GLOBAL_DOCUMENT_COLOR_TOKENS = {
  link: PRESENTATION_DARK_TEXT_COLORS.link,
  code: PRESENTATION_DARK_TEXT_COLORS.code,
  liveValue: PRESENTATION_DARK_TEXT_COLORS.liveValue,
  prose: PRESENTATION_DARK_TEXT_COLORS.prose,
  secondary: PRESENTATION_DARK_TEXT_COLORS.secondary,
} as const;

function mergeThemePresetList<T extends { id: string }>(
  globalPresets: readonly T[] | undefined,
  coursePresets: readonly T[] | undefined,
): T[] {
  const byId = new Map<string, T>();
  for (const preset of globalPresets ?? []) {
    byId.set(preset.id, preset);
  }
  for (const preset of coursePresets ?? []) {
    byId.set(preset.id, preset);
  }
  return [...byId.values()];
}

/** Course presets override global presets when ids collide. */
export function mergeCourseThemesWithGlobal(
  courseThemes: CourseThemesV1 | undefined,
): CourseThemesV1 {
  return {
    card: mergeThemePresetList(COURSE_STUDIO_GLOBAL_THEMES.card, courseThemes?.card),
    markdown: mergeThemePresetList(
      COURSE_STUDIO_GLOBAL_THEMES.markdown,
      courseThemes?.markdown,
    ),
  };
}

export function ensureCourseGlobalDocumentThemes(course: CourseV1): CourseV1 {
  const merged = mergeCourseThemesWithGlobal(course.themes);
  return {
    ...course,
    themes: merged,
  };
}

export function resolveGlobalMarkdownThemePreset(
  courseThemes: CourseThemesV1 | undefined,
  presetId: string | undefined,
): MarkdownThemePresetV1 {
  const merged = mergeCourseThemesWithGlobal(courseThemes);
  const resolvedId = presetId ?? COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID;
  return (
    merged.markdown?.find((entry) => entry.id === resolvedId) ??
    COURSE_STUDIO_GLOBAL_MARKDOWN_PRESET
  );
}

export function resolveGlobalCardThemePreset(
  courseThemes: CourseThemesV1 | undefined,
  presetId: string | undefined,
): CardThemePresetV1 {
  const merged = mergeCourseThemesWithGlobal(courseThemes);
  const resolvedId = presetId ?? COURSE_STUDIO_GLOBAL_DOCUMENT_PRESET_ID;
  return (
    merged.card?.find((entry) => entry.id === resolvedId) ??
    COURSE_STUDIO_GLOBAL_CARD_PRESET
  );
}

export function globalMarkdownThemeDefaults(): MarkdownBlockColors {
  return { ...COURSE_STUDIO_GLOBAL_MARKDOWN_PRESET.colors };
}

export function globalCardThemeDefaults(): CardBlockColors {
  return { ...COURSE_STUDIO_GLOBAL_CARD_PRESET.colors };
}
