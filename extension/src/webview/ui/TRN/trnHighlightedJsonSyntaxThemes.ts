import {
  dracula,
  materialDark,
  nightOwl,
  nord,
  oneDark,
  oneLight,
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Curated Prism themes for {@link TRNHighlightedJsonBlock} — direct imports so unused themes are not bundled from the full prism index.
 */
export const TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS = [
  { id: "oneDark", label: "One Dark" },
  { id: "vscDarkPlus", label: "VS Code Dark+" },
  { id: "dracula", label: "Dracula" },
  { id: "nightOwl", label: "Night Owl" },
  { id: "nord", label: "Nord" },
  { id: "materialDark", label: "Material Dark" },
  { id: "oneLight", label: "One Light" },
  { id: "vs", label: "VS (light)" },
] as const;

export type TRNHighlightedJsonSyntaxThemeId =
  (typeof TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS)[number]["id"];

export const TRN_HIGHLIGHTED_JSON_PRISM_STYLES = {
  oneDark,
  vscDarkPlus,
  dracula,
  nightOwl,
  nord,
  materialDark,
  oneLight,
  vs,
} as const satisfies Record<TRNHighlightedJsonSyntaxThemeId, typeof oneDark>;

export const TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID: TRNHighlightedJsonSyntaxThemeId =
  "oneDark";

export function isTrnHighlightedJsonSyntaxThemeId(value: string): value is TRNHighlightedJsonSyntaxThemeId {
  return TRN_HIGHLIGHTED_JSON_SYNTAX_THEME_OPTIONS.some((o) => o.id === value);
}
