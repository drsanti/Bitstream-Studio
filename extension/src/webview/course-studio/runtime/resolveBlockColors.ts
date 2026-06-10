import type { CardBlockColorKey, CardBlockColors } from "../schemas/cardBlockColors";
import {
  stripEmptyCardBlockColors,
} from "../schemas/cardBlockColors";
import type {
  DashboardWidgetBlockColorKey,
  DashboardWidgetBlockColors,
} from "../schemas/dashboardWidgetBlockColors";
import { stripEmptyDashboardWidgetBlockColors } from "../schemas/dashboardWidgetBlockColors";
import { findCardThemePreset, findMarkdownThemePreset, type CourseThemesV1 } from "../schemas/courseThemes.v1";
import type { MarkdownBlockColorKey, MarkdownBlockColors } from "../schemas/markdownBlockColors";
import {
  stripEmptyMarkdownBlockColors,
} from "../schemas/markdownBlockColors";
import type { PageMetaV1 } from "../schemas/pageMeta";

function mergeHexColorLayers<K extends string>(
  keys: readonly K[],
  layers: ReadonlyArray<Partial<Record<K, string>> | undefined>,
): Partial<Record<K, string>> {
  const next: Partial<Record<K, string>> = {};
  for (const key of keys) {
    for (const layer of layers) {
      const value = layer?.[key];
      if (value != null && value.length > 0) {
        next[key] = value;
        break;
      }
    }
  }
  return next;
}

const CARD_COLOR_KEYS = ["background", "border", "title", "icon", "body"] as const satisfies readonly CardBlockColorKey[];

const MARKDOWN_COLOR_KEYS = [
  "background",
  "body",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "link",
  "inlineCode",
  "inlineCodeBackground",
  "blockCode",
  "blockCodeBackground",
] as const satisfies readonly MarkdownBlockColorKey[];

const DASHBOARD_WIDGET_COLOR_KEYS = [
  "background",
  "border",
  "title",
  "headerBackground",
  "headerBorder",
] as const satisfies readonly DashboardWidgetBlockColorKey[];

/** page default → block override (first match wins per field). */
export function resolveDashboardWidgetBlockEffectiveColors(
  blockColors: DashboardWidgetBlockColors | undefined,
  pageMeta: PageMetaV1 | undefined,
  _courseThemes: CourseThemesV1 | undefined,
): DashboardWidgetBlockColors | undefined {
  const merged = mergeHexColorLayers(DASHBOARD_WIDGET_COLOR_KEYS, [
    pageMeta?.dashboardWidgetColors,
    blockColors,
  ]);
  return stripEmptyDashboardWidgetBlockColors(merged as DashboardWidgetBlockColors);
}

/** course preset → page default → block override (first match wins per field). */
export function resolveCardBlockEffectiveColors(
  blockColors: CardBlockColors | undefined,
  pageMeta: PageMetaV1 | undefined,
  courseThemes: CourseThemesV1 | undefined,
): CardBlockColors | undefined {
  const preset = findCardThemePreset(courseThemes, pageMeta?.cardThemePresetId);
  const merged = mergeHexColorLayers(CARD_COLOR_KEYS, [
    preset?.colors,
    pageMeta?.cardColors,
    blockColors,
  ]);
  return stripEmptyCardBlockColors(merged as CardBlockColors);
}

export function resolveMarkdownBlockEffectiveColors(
  blockColors: MarkdownBlockColors | undefined,
  pageMeta: PageMetaV1 | undefined,
  courseThemes: CourseThemesV1 | undefined,
): MarkdownBlockColors | undefined {
  const preset = findMarkdownThemePreset(courseThemes, pageMeta?.markdownThemePresetId);
  const merged = mergeHexColorLayers(MARKDOWN_COLOR_KEYS, [
    preset?.colors,
    pageMeta?.markdownColors,
    blockColors,
  ]);
  const syntaxTheme =
    blockColors?.codeSyntaxTheme ??
    pageMeta?.markdownColors?.codeSyntaxTheme ??
    preset?.colors?.codeSyntaxTheme;
  const withSyntax =
    syntaxTheme != null
      ? { ...(merged as MarkdownBlockColors), codeSyntaxTheme: syntaxTheme }
      : (merged as MarkdownBlockColors);
  return stripEmptyMarkdownBlockColors(withSyntax);
}
