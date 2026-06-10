import { z } from "zod";
import type { CSSProperties } from "react";
import {
  courseBlockColorHexEquivalent,
  courseBlockColorHexSchema,
  normalizeCourseBlockColorHex,
} from "./blockColorHex";

export const pageGridGuideBorderStyleSchema = z.enum(["dashed", "solid", "dotted"]);

export type PageGridGuideBorderStyle = z.infer<typeof pageGridGuideBorderStyleSchema>;

export const pageGridGuidesChromeSchema = z.object({
  border: courseBlockColorHexSchema.optional(),
  background: courseBlockColorHexSchema.optional(),
  borderStyle: pageGridGuideBorderStyleSchema.optional(),
});

export const pageGridCellChromeSchema = z.object({
  idleBorder: courseBlockColorHexSchema.optional(),
  idleBackground: courseBlockColorHexSchema.optional(),
  hoverBorder: courseBlockColorHexSchema.optional(),
  hoverBackground: courseBlockColorHexSchema.optional(),
  selectedBorder: courseBlockColorHexSchema.optional(),
  selectedBackground: courseBlockColorHexSchema.optional(),
  previewBorder: courseBlockColorHexSchema.optional(),
});

export const pageGridPublishedChromeSchema = z.object({
  showCellChrome: z.boolean().optional(),
  useGuideStyleForCells: z.boolean().optional(),
});

export const pageGridChromeSchema = z.object({
  canvasBackground: courseBlockColorHexSchema.optional(),
  guides: pageGridGuidesChromeSchema.optional(),
  cell: pageGridCellChromeSchema.optional(),
  published: pageGridPublishedChromeSchema.optional(),
});

export type PageGridGuidesChrome = z.infer<typeof pageGridGuidesChromeSchema>;
export type PageGridCellChrome = z.infer<typeof pageGridCellChromeSchema>;
export type PageGridPublishedChrome = z.infer<typeof pageGridPublishedChromeSchema>;
export type PageGridChrome = z.infer<typeof pageGridChromeSchema>;

export type PageGridCellChromeKey = keyof PageGridCellChrome;
export type PageGridGuidesChromeKey = keyof PageGridGuidesChrome;

/** Composer guide overlay + editable cell chrome defaults (match legacy amber/muted styling). */
export const PAGE_GRID_CHROME_THEME_DEFAULTS: Required<
  Pick<PageGridChrome, "canvasBackground"> & {
    guides: Required<PageGridGuidesChrome>;
    cell: Required<PageGridCellChrome>;
  }
> = {
  canvasBackground: "#00000000",
  guides: {
    border: "#f59e0b40",
    background: "#f59e0b0a",
    borderStyle: "dashed",
  },
  cell: {
    idleBorder: "#a1a1aa47",
    idleBackground: "#00000000",
    hoverBorder: "#f59e0b66",
    hoverBackground: "#f59e0b0a",
    selectedBorder: "#f59e0bbf",
    selectedBackground: "#f59e0b0f",
    previewBorder: "#f59e0b8c",
  },
};

export const PAGE_GRID_GUIDE_BORDER_STYLE_OPTIONS: ReadonlyArray<{
  value: PageGridGuideBorderStyle;
  label: string;
}> = [
  { value: "dashed", label: "Dashed" },
  { value: "solid", label: "Solid" },
  { value: "dotted", label: "Dotted" },
];

export const PAGE_GRID_CHROME_INSPECTOR_GROUPS: ReadonlyArray<{
  id: "canvas" | "guides" | "cell-idle" | "cell-hover" | "cell-selection";
  title: string;
  rows: ReadonlyArray<{
    key: PageGridCellChromeKey | PageGridGuidesChromeKey | "canvasBackground";
    label: string;
    hint?: string;
  }>;
}> = [
  {
    id: "canvas",
    title: "Canvas",
    rows: [{ key: "canvasBackground", label: "Background" }],
  },
  {
    id: "guides",
    title: "Guide cells",
    rows: [
      { key: "border", label: "Border", hint: "Composer overlay grid lines." },
      { key: "background", label: "Fill" },
    ],
  },
  {
    id: "cell-idle",
    title: "Block cells — idle",
    rows: [
      { key: "idleBorder", label: "Border" },
      { key: "idleBackground", label: "Background" },
    ],
  },
  {
    id: "cell-hover",
    title: "Block cells — hover",
    rows: [
      { key: "hoverBorder", label: "Border" },
      { key: "hoverBackground", label: "Background" },
    ],
  },
  {
    id: "cell-selection",
    title: "Block cells — selection",
    rows: [
      { key: "selectedBorder", label: "Selected border" },
      { key: "selectedBackground", label: "Selected background" },
      { key: "previewBorder", label: "Drag preview border" },
    ],
  },
];

function stripOptionalRecord<T extends Record<string, unknown>>(value: T | undefined): T | undefined {
  if (value == null) {
    return undefined;
  }
  const next: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    const entry = value[key];
    if (entry !== undefined) {
      next[key] = entry;
    }
  }
  return Object.keys(next).length > 0 ? (next as T) : undefined;
}

export function stripEmptyPageGridChrome(chrome: PageGridChrome | undefined): PageGridChrome | undefined {
  if (chrome == null) {
    return undefined;
  }
  const next: PageGridChrome = {};
  if (chrome.canvasBackground != null && chrome.canvasBackground.length > 0) {
    next.canvasBackground = chrome.canvasBackground;
  }
  const guides = stripOptionalRecord(chrome.guides);
  if (guides != null) {
    next.guides = guides;
  }
  const cell = stripOptionalRecord(chrome.cell);
  if (cell != null) {
    next.cell = cell;
  }
  const published = stripOptionalRecord(chrome.published);
  if (published != null) {
    next.published = published;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function stripCellColorMatchingDefault(
  colors: PageGridCellChrome | undefined,
): PageGridCellChrome | undefined {
  if (colors == null) {
    return undefined;
  }
  const next: PageGridCellChrome = { ...colors };
  for (const key of Object.keys(PAGE_GRID_CHROME_THEME_DEFAULTS.cell) as PageGridCellChromeKey[]) {
    const value = next[key];
    if (
      value != null &&
      courseBlockColorHexEquivalent(value, PAGE_GRID_CHROME_THEME_DEFAULTS.cell[key])
    ) {
      delete next[key];
    }
  }
  return stripOptionalRecord(next);
}

function stripGuideColorMatchingDefault(
  guides: PageGridGuidesChrome | undefined,
): PageGridGuidesChrome | undefined {
  if (guides == null) {
    return undefined;
  }
  const next: PageGridGuidesChrome = { ...guides };
  for (const key of ["border", "background"] as const) {
    const value = next[key];
    if (
      value != null &&
      courseBlockColorHexEquivalent(value, PAGE_GRID_CHROME_THEME_DEFAULTS.guides[key])
    ) {
      delete next[key];
    }
  }
  if (
    next.borderStyle != null &&
    next.borderStyle === PAGE_GRID_CHROME_THEME_DEFAULTS.guides.borderStyle
  ) {
    delete next.borderStyle;
  }
  return stripOptionalRecord(next);
}

export function stripPageGridChromeMatchingThemeDefaults(
  chrome: PageGridChrome | undefined,
): PageGridChrome | undefined {
  if (chrome == null) {
    return undefined;
  }
  const next: PageGridChrome = { ...chrome };
  if (
    next.canvasBackground != null &&
    courseBlockColorHexEquivalent(
      next.canvasBackground,
      PAGE_GRID_CHROME_THEME_DEFAULTS.canvasBackground,
    )
  ) {
    delete next.canvasBackground;
  }
  next.guides = stripGuideColorMatchingDefault(next.guides);
  next.cell = stripCellColorMatchingDefault(next.cell);
  if (next.published?.showCellChrome !== true) {
    if (next.published != null) {
      delete next.published.showCellChrome;
    }
  }
  if (next.published?.useGuideStyleForCells !== true) {
    if (next.published != null) {
      delete next.published.useGuideStyleForCells;
    }
  }
  return stripEmptyPageGridChrome(next);
}

export function resolvePageGridChrome(chrome: PageGridChrome | undefined): {
  canvasBackground: string;
  guides: Required<PageGridGuidesChrome>;
  cell: Required<PageGridCellChrome>;
  published: Required<PageGridPublishedChrome>;
} {
  return {
    canvasBackground:
      chrome?.canvasBackground ?? PAGE_GRID_CHROME_THEME_DEFAULTS.canvasBackground,
    guides: {
      border: chrome?.guides?.border ?? PAGE_GRID_CHROME_THEME_DEFAULTS.guides.border,
      background:
        chrome?.guides?.background ?? PAGE_GRID_CHROME_THEME_DEFAULTS.guides.background,
      borderStyle:
        chrome?.guides?.borderStyle ?? PAGE_GRID_CHROME_THEME_DEFAULTS.guides.borderStyle,
    },
    cell: {
      idleBorder: chrome?.cell?.idleBorder ?? PAGE_GRID_CHROME_THEME_DEFAULTS.cell.idleBorder,
      idleBackground:
        chrome?.cell?.idleBackground ?? PAGE_GRID_CHROME_THEME_DEFAULTS.cell.idleBackground,
      hoverBorder: chrome?.cell?.hoverBorder ?? PAGE_GRID_CHROME_THEME_DEFAULTS.cell.hoverBorder,
      hoverBackground:
        chrome?.cell?.hoverBackground ?? PAGE_GRID_CHROME_THEME_DEFAULTS.cell.hoverBackground,
      selectedBorder:
        chrome?.cell?.selectedBorder ?? PAGE_GRID_CHROME_THEME_DEFAULTS.cell.selectedBorder,
      selectedBackground:
        chrome?.cell?.selectedBackground ??
        PAGE_GRID_CHROME_THEME_DEFAULTS.cell.selectedBackground,
      previewBorder:
        chrome?.cell?.previewBorder ?? PAGE_GRID_CHROME_THEME_DEFAULTS.cell.previewBorder,
    },
    published: {
      showCellChrome: chrome?.published?.showCellChrome === true,
      useGuideStyleForCells: chrome?.published?.useGuideStyleForCells === true,
    },
  };
}

export function pageGridChromeToStyleVars(chrome: PageGridChrome | undefined): CSSProperties {
  const resolved = resolvePageGridChrome(chrome);
  const style: Record<string, string> = {
    "--course-grid-canvas-bg": resolved.canvasBackground,
    "--course-grid-guide-border": resolved.guides.border,
    "--course-grid-guide-bg": resolved.guides.background,
    "--course-grid-guide-border-style": resolved.guides.borderStyle,
    "--course-grid-cell-idle-border": resolved.cell.idleBorder,
    "--course-grid-cell-idle-bg": resolved.cell.idleBackground,
    "--course-grid-cell-hover-border": resolved.cell.hoverBorder,
    "--course-grid-cell-hover-bg": resolved.cell.hoverBackground,
    "--course-grid-cell-selected-border": resolved.cell.selectedBorder,
    "--course-grid-cell-selected-bg": resolved.cell.selectedBackground,
    "--course-grid-cell-preview-border": resolved.cell.previewBorder,
  };
  return style as CSSProperties;
}

export function patchPageGridChromeColor(
  chrome: PageGridChrome | undefined,
  target: "canvasBackground" | PageGridCellChromeKey | PageGridGuidesChromeKey,
  value: string | undefined,
  defaults: string,
): PageGridChrome | undefined {
  const normalized =
    value == null || value.length === 0 ? undefined : normalizeCourseBlockColorHex(value);
  const next: PageGridChrome = { ...(chrome ?? {}) };

  const assignColor = (equivalentDefault: string) => {
    if (normalized == null || courseBlockColorHexEquivalent(normalized, equivalentDefault)) {
      return undefined;
    }
    return normalized;
  };

  if (target === "canvasBackground") {
    const color = assignColor(defaults);
    if (color == null) {
      delete next.canvasBackground;
    } else {
      next.canvasBackground = color;
    }
    return stripPageGridChromeMatchingThemeDefaults(next);
  }

  if (target === "border" || target === "background" || target === "borderStyle") {
    const guides: PageGridGuidesChrome = { ...(next.guides ?? {}) };
    if (target === "borderStyle") {
      if (value == null || value === PAGE_GRID_CHROME_THEME_DEFAULTS.guides.borderStyle) {
        delete guides.borderStyle;
      } else {
        guides.borderStyle = value as PageGridGuideBorderStyle;
      }
    } else {
      const color = assignColor(defaults);
      if (color == null) {
        delete guides[target];
      } else {
        guides[target] = color;
      }
    }
    next.guides = stripGuideColorMatchingDefault(guides);
    if (next.guides == null) {
      delete next.guides;
    }
    return stripPageGridChromeMatchingThemeDefaults(next);
  }

  const cell: PageGridCellChrome = { ...(next.cell ?? {}) };
  const color = assignColor(defaults);
  if (color == null) {
    delete cell[target];
  } else {
    cell[target] = color;
  }
  next.cell = stripCellColorMatchingDefault(cell);
  if (next.cell == null) {
    delete next.cell;
  }
  return stripPageGridChromeMatchingThemeDefaults(next);
}

export function patchPageGridChrome(
  chrome: PageGridChrome | undefined,
  patch: Partial<PageGridChrome>,
): PageGridChrome | undefined {
  const next: PageGridChrome = { ...(chrome ?? {}), ...patch };

  if ("canvasBackground" in patch && patch.canvasBackground === undefined) {
    delete next.canvasBackground;
  }

  if ("guides" in patch) {
    if (patch.guides === undefined) {
      delete next.guides;
    } else {
      const guides: PageGridGuidesChrome = { ...(chrome?.guides ?? {}) };
      for (const key of Object.keys(patch.guides) as Array<keyof PageGridGuidesChrome>) {
        const value = patch.guides[key];
        if (value === undefined) {
          delete guides[key];
        } else {
          guides[key] = value;
        }
      }
      next.guides = stripGuideColorMatchingDefault(guides);
      if (next.guides == null) {
        delete next.guides;
      }
    }
  }

  if ("cell" in patch) {
    if (patch.cell === undefined) {
      delete next.cell;
    } else {
      const cell: PageGridCellChrome = { ...(chrome?.cell ?? {}) };
      for (const key of Object.keys(patch.cell) as PageGridCellChromeKey[]) {
        const value = patch.cell[key];
        if (value === undefined) {
          delete cell[key];
        } else {
          cell[key] = value;
        }
      }
      next.cell = stripCellColorMatchingDefault(cell);
      if (next.cell == null) {
        delete next.cell;
      }
    }
  }

  if ("published" in patch) {
    if (patch.published === undefined) {
      delete next.published;
    } else {
      const published: PageGridPublishedChrome = {
        ...(chrome?.published ?? {}),
      };
      for (const key of Object.keys(patch.published) as Array<keyof PageGridPublishedChrome>) {
        const value = patch.published[key];
        if (value === undefined) {
          delete published[key];
        } else {
          published[key] = value;
        }
      }
      if (published.showCellChrome !== true) {
        delete published.showCellChrome;
      }
      if (published.useGuideStyleForCells !== true) {
        delete published.useGuideStyleForCells;
      }
      next.published = stripOptionalRecord(published);
      if (next.published == null) {
        delete next.published;
      }
    }
  }

  return stripPageGridChromeMatchingThemeDefaults(next);
}

export function pageGridChromeDefaultHex(
  target: "canvasBackground" | PageGridCellChromeKey | PageGridGuidesChromeKey,
): string {
  if (target === "canvasBackground") {
    return PAGE_GRID_CHROME_THEME_DEFAULTS.canvasBackground;
  }
  if (target === "border" || target === "background") {
    return PAGE_GRID_CHROME_THEME_DEFAULTS.guides[target];
  }
  return PAGE_GRID_CHROME_THEME_DEFAULTS.cell[target];
}

export function pageGridPublishedCellClassName(chrome: PageGridChrome | undefined): string {
  const resolved = resolvePageGridChrome(chrome);
  if (!resolved.published.showCellChrome) {
    return "course-page-grid__cell";
  }
  const parts = ["course-page-grid__cell", "course-page-grid__cell--published-chrome"];
  if (resolved.published.useGuideStyleForCells) {
    parts.push("course-page-grid__cell--published-guide-style");
  }
  return parts.join(" ");
}
