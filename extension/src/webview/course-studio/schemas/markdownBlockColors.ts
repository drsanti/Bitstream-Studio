import { z } from "zod";
import type { CSSProperties } from "react";
import {
  TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS,
  isTrnHighlightedJsonSyntaxThemeId,
  type TRNHighlightedJsonSyntaxThemeId,
} from "../../ui/TRN/trnHighlightedJsonSyntaxThemes";
import {
  COURSE_MARKDOWN_DEFAULT_CODE_SYNTAX_THEME,
  PRESENTATION_DARK_TEXT_COLORS,
} from "../../presentation/design/presentationTextColors";
import {
  courseBlockColorHexSchema,
  formatCourseBlockColorDisplay,
  normalizeCourseBlockColorHex,
} from "./blockColorHex";

export const MARKDOWN_BLOCK_CODE_SYNTAX_THEME_IDS = TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS.map(
  (option) => option.id,
) as readonly TRNHighlightedJsonSyntaxThemeId[];

export const markdownBlockCodeSyntaxThemeSchema = z.enum(
  MARKDOWN_BLOCK_CODE_SYNTAX_THEME_IDS as [
    TRNHighlightedJsonSyntaxThemeId,
    ...TRNHighlightedJsonSyntaxThemeId[],
  ],
);

export const markdownBlockColorHexSchema = courseBlockColorHexSchema;

export const markdownBlockColorsSchema = z.object({
  background: markdownBlockColorHexSchema.optional(),
  body: markdownBlockColorHexSchema.optional(),
  h1: markdownBlockColorHexSchema.optional(),
  h2: markdownBlockColorHexSchema.optional(),
  h3: markdownBlockColorHexSchema.optional(),
  h4: markdownBlockColorHexSchema.optional(),
  strong: markdownBlockColorHexSchema.optional(),
  link: markdownBlockColorHexSchema.optional(),
  inlineCode: markdownBlockColorHexSchema.optional(),
  inlineCodeBackground: markdownBlockColorHexSchema.optional(),
  blockCode: markdownBlockColorHexSchema.optional(),
  blockCodeBackground: markdownBlockColorHexSchema.optional(),
  codeSyntaxTheme: markdownBlockCodeSyntaxThemeSchema.optional(),
});

export type MarkdownBlockColors = z.infer<typeof markdownBlockColorsSchema>;

export type MarkdownBlockColorKey = Exclude<keyof MarkdownBlockColors, "codeSyntaxTheme">;

/** Picker defaults when a field uses the theme (not persisted). */
export const MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS: Record<MarkdownBlockColorKey, string> = {
  background: "#18181b",
  body: PRESENTATION_DARK_TEXT_COLORS.prose,
  h1: "#fafafa",
  h2: "#fafafa",
  h3: "#fafafa",
  h4: PRESENTATION_DARK_TEXT_COLORS.secondary,
  strong: "#fafafa",
  link: PRESENTATION_DARK_TEXT_COLORS.link,
  inlineCode: PRESENTATION_DARK_TEXT_COLORS.code,
  inlineCodeBackground: "#18181b",
  blockCode: "#fafafa",
  blockCodeBackground: "#18181b",
};

export const MARKDOWN_BLOCK_COLOR_CSS_VARS: Record<MarkdownBlockColorKey, string> = {
  background: "--course-md-bg",
  body: "--course-md-body",
  h1: "--course-md-h1",
  h2: "--course-md-h2",
  h3: "--course-md-h3",
  h4: "--course-md-h4",
  strong: "--course-md-strong",
  link: "--course-md-link",
  inlineCode: "--course-md-inline-code",
  inlineCodeBackground: "--course-md-inline-code-bg",
  blockCode: "--course-md-block-code",
  blockCodeBackground: "--course-md-block-code-bg",
};

export const MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS: ReadonlyArray<{
  id: "chrome" | "typography" | "code";
  title: string;
  rows: ReadonlyArray<{ key: MarkdownBlockColorKey; label: string }>;
}> = [
  {
    id: "chrome",
    title: "Chrome",
    rows: [{ key: "background", label: "Background" }],
  },
  {
    id: "typography",
    title: "Typography",
    rows: [
      { key: "body", label: "Body" },
      { key: "h1", label: "H1" },
      { key: "h2", label: "H2" },
      { key: "h3", label: "H3" },
      { key: "h4", label: "H4" },
      { key: "strong", label: "Bold" },
      { key: "link", label: "Links" },
    ],
  },
  {
    id: "code",
    title: "Code",
    rows: [
      { key: "inlineCode", label: "Inline text" },
      { key: "inlineCodeBackground", label: "Inline bg" },
      { key: "blockCode", label: "Block text" },
      { key: "blockCodeBackground", label: "Block bg" },
    ],
  },
];

/** @deprecated Use {@link MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS} */
export const MARKDOWN_BLOCK_COLOR_INSPECTOR_ROWS: ReadonlyArray<{
  key: MarkdownBlockColorKey;
  label: string;
}> = MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS.flatMap((group) => group.rows);

export const MARKDOWN_BLOCK_CODE_SYNTAX_THEME_SELECT_OPTIONS = TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS.map(
  (option) => ({
    value: option.id,
    label: option.label,
  }),
);

export const formatMarkdownBlockColorDisplay = formatCourseBlockColorDisplay;
export const normalizeMarkdownBlockColorHex = normalizeCourseBlockColorHex;

export function stripEmptyMarkdownBlockColors(
  colors: MarkdownBlockColors | undefined,
): MarkdownBlockColors | undefined {
  if (colors == null) {
    return undefined;
  }
  const next: Partial<MarkdownBlockColors> = {};
  for (const key of Object.keys(MARKDOWN_BLOCK_COLOR_CSS_VARS) as MarkdownBlockColorKey[]) {
    const value = colors[key];
    if (value != null && value.length > 0) {
      next[key] = value;
    }
  }
  if (colors.codeSyntaxTheme != null) {
    next.codeSyntaxTheme = colors.codeSyntaxTheme;
  }
  return Object.keys(next).length > 0 ? (next as MarkdownBlockColors) : undefined;
}

export function resolveMarkdownBlockCodeSyntaxTheme(
  colors: MarkdownBlockColors | undefined,
): TRNHighlightedJsonSyntaxThemeId {
  const theme = colors?.codeSyntaxTheme;
  if (theme != null && isTrnHighlightedJsonSyntaxThemeId(theme)) {
    return theme;
  }
  return COURSE_MARKDOWN_DEFAULT_CODE_SYNTAX_THEME;
}

export type MarkdownBlockMermaidTheme = "dark" | "default" | "neutral";

function hexChannelLuminance(channelHex: string): number {
  const value = Number.parseInt(channelHex, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminanceFromHex(hex: string): number | null {
  const normalized = hex.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(normalized)) {
    return null;
  }
  const rgb = normalized.slice(1, 7);
  const r = hexChannelLuminance(rgb.slice(0, 2));
  const g = hexChannelLuminance(rgb.slice(2, 4));
  const b = hexChannelLuminance(rgb.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pick a Mermaid theme from block chrome (background luminance). */
export function resolveMarkdownBlockMermaidTheme(
  colors: MarkdownBlockColors | undefined,
): MarkdownBlockMermaidTheme {
  const luminance = relativeLuminanceFromHex(colors?.background ?? "#18181b");
  if (luminance == null) {
    return "dark";
  }
  if (luminance > 0.62) {
    return "default";
  }
  if (luminance > 0.42) {
    return "neutral";
  }
  return "dark";
}

export function patchMarkdownBlockCodeSyntaxTheme(
  colors: MarkdownBlockColors | undefined,
  theme: TRNHighlightedJsonSyntaxThemeId | undefined,
): MarkdownBlockColors | undefined {
  const next: MarkdownBlockColors = { ...(colors ?? {}) };
  if (theme == null) {
    delete next.codeSyntaxTheme;
  } else {
    next.codeSyntaxTheme = theme;
  }
  return stripEmptyMarkdownBlockColors(next);
}

export function patchMarkdownBlockColor(
  colors: MarkdownBlockColors | undefined,
  key: MarkdownBlockColorKey,
  value: string | undefined,
): MarkdownBlockColors | undefined {
  const normalized =
    value == null || value.length === 0 ? undefined : normalizeMarkdownBlockColorHex(value);
  const next: MarkdownBlockColors = { ...(colors ?? {}) };
  if (normalized == null) {
    delete next[key];
  } else {
    next[key] = normalized;
  }
  return stripEmptyMarkdownBlockColors(next);
}

export function markdownBlockColorsToStyle(
  colors: MarkdownBlockColors | undefined,
): CSSProperties | undefined {
  if (colors == null) {
    return undefined;
  }
  const style: Record<string, string> = {};
  for (const key of Object.keys(MARKDOWN_BLOCK_COLOR_CSS_VARS) as MarkdownBlockColorKey[]) {
    const value = colors[key];
    if (value != null) {
      style[MARKDOWN_BLOCK_COLOR_CSS_VARS[key]] = value;
    }
  }
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}

export function hasMarkdownBlockCustomBackground(colors: MarkdownBlockColors | undefined): boolean {
  return colors?.background != null && colors.background.length > 0;
}
