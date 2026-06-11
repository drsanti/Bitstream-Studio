import type { PageBlockKind } from "./blockFactory";

export type CourseBlockPaletteCategory = "structure" | "content" | "live" | "visual" | "embed";

export type CourseBlockPaletteTier = "default" | "more";

export type CourseBlockPaletteIconId =
  | "heading"
  | "callout"
  | "markdown"
  | "card"
  | "live-metric"
  | "dashboard-widget"
  | "widget-board"
  | "sensor-telemetry-card"
  | "diagram"
  | "scene-3d"
  | "image"
  | "code"
  | "youtube"
  | "iframe"
  | "html-page"
  | "embed";

export type CourseBlockPaletteEntry = {
  kind: PageBlockKind;
  label: string;
  description: string;
  category: CourseBlockPaletteCategory;
  icon: CourseBlockPaletteIconId;
  defaultSpan: { columnSpan: number; rowSpan: number };
  accentClassName?: string;
  tier: CourseBlockPaletteTier;
  /** Omit from palette rows — merged under the embed group tile. */
  paletteHidden?: boolean;
};

export const COURSE_BLOCK_PALETTE_CATEGORY_LABELS: Record<CourseBlockPaletteCategory, string> = {
  structure: "Structure",
  content: "Content",
  live: "Live data",
  visual: "Visual",
  embed: "Embed",
};

export const COURSE_BLOCK_PALETTE_CATEGORY_ORDER: readonly CourseBlockPaletteCategory[] = [
  "structure",
  "content",
  "live",
  "visual",
  "embed",
];

export const COURSE_BLOCK_EMBED_PALETTE_KINDS = ["youtube", "iframe"] as const satisfies readonly PageBlockKind[];

export const COURSE_BLOCK_PALETTE_EMBED_GROUP = {
  label: "Embed",
  description: "Video or external page",
  category: "embed" as const,
  icon: "embed" as const,
  tier: "more" as const,
  accentClassName: "text-rose-400/90",
};

export const PAGE_BLOCK_PALETTE: readonly CourseBlockPaletteEntry[] = [
  {
    kind: "heading",
    label: "Heading",
    description: "Title row",
    category: "structure",
    icon: "heading",
    defaultSpan: { columnSpan: 12, rowSpan: 2 },
    tier: "default",
  },
  {
    kind: "markdown",
    label: "Markdown",
    description: "Theory / inline or remote URL",
    category: "content",
    icon: "markdown",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
    tier: "default",
  },
  {
    kind: "card",
    label: "Card",
    description: "Short copy",
    category: "content",
    icon: "card",
    defaultSpan: { columnSpan: 4, rowSpan: 2 },
    tier: "default",
  },
  {
    kind: "callout-info",
    label: "Callout",
    description: "Info admonition",
    category: "content",
    icon: "callout",
    defaultSpan: { columnSpan: 6, rowSpan: 2 },
    accentClassName: "text-sky-400/90",
    tier: "default",
  },
  {
    kind: "code",
    label: "Code",
    description: "Syntax snippet",
    category: "content",
    icon: "code",
    defaultSpan: { columnSpan: 6, rowSpan: 3 },
    tier: "more",
  },
  {
    kind: "image",
    label: "Image",
    description: "Photo or diagram",
    category: "content",
    icon: "image",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
    tier: "more",
  },
  {
    kind: "live-metric",
    label: "Live metric",
    description: "Tri-axis widget",
    category: "live",
    icon: "live-metric",
    defaultSpan: { columnSpan: 4, rowSpan: 3 },
    accentClassName: "text-amber-400/90",
    tier: "more",
  },
  {
    kind: "dashboard-widget",
    label: "Dashboard widget",
    description: "Gauge, bar, numeric, LED, status",
    category: "live",
    icon: "dashboard-widget",
    defaultSpan: { columnSpan: 3, rowSpan: 3 },
    accentClassName: "text-cyan-400/90",
    tier: "default",
  },
  {
    kind: "widget-board",
    label: "Widget board",
    description: "Composed telemetry panel with themed metric cards and gauges",
    category: "live",
    icon: "widget-board",
    defaultSpan: { columnSpan: 8, rowSpan: 5 },
    accentClassName: "text-cyan-400/90",
    tier: "default",
  },
  {
    kind: "sensor-telemetry-card",
    label: "Sensor card",
    description: "One Telemetry Data card (Euler, pressure, …)",
    category: "live",
    icon: "sensor-telemetry-card",
    defaultSpan: { columnSpan: 5, rowSpan: 3 },
    accentClassName: "text-emerald-400/90",
    tier: "default",
  },
  {
    kind: "diagram-2d",
    label: "Diagram",
    description: "Konva live canvas",
    category: "visual",
    icon: "diagram",
    defaultSpan: { columnSpan: 5, rowSpan: 3 },
    accentClassName: "text-cyan-400/90",
    tier: "default",
  },
  {
    kind: "scene-3d",
    label: "3D Scene",
    description: "Editable GLB scene document",
    category: "visual",
    icon: "scene-3d",
    defaultSpan: { columnSpan: 5, rowSpan: 4 },
    accentClassName: "text-violet-400/90",
    tier: "default",
  },
  {
    kind: "youtube",
    label: "YouTube",
    description: "Video embed",
    category: "embed",
    icon: "youtube",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
    accentClassName: "text-rose-400/90",
    tier: "more",
    paletteHidden: true,
  },
  {
    kind: "iframe",
    label: "iFrame",
    description: "External page",
    category: "embed",
    icon: "iframe",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
    accentClassName: "text-emerald-400/90",
    tier: "more",
    paletteHidden: true,
  },
  {
    kind: "html-page",
    label: "HTML page",
    description: "Single-file HTML/CSS/JS demo",
    category: "embed",
    icon: "html-page",
    defaultSpan: { columnSpan: 6, rowSpan: 6 },
    accentClassName: "text-emerald-400/90",
    tier: "more",
  },
];

export function courseBlockPaletteVisibleEntries(
  tier: CourseBlockPaletteTier,
): CourseBlockPaletteEntry[] {
  return PAGE_BLOCK_PALETTE.filter((entry) => entry.tier === tier && entry.paletteHidden !== true);
}

export function courseBlockEmbedPaletteEntries(): CourseBlockPaletteEntry[] {
  return PAGE_BLOCK_PALETTE.filter((entry) =>
    (COURSE_BLOCK_EMBED_PALETTE_KINDS as readonly string[]).includes(entry.kind),
  );
}

/** Rows shown under the collapsed “More blocks” section (includes the embed group). */
export function courseBlockPaletteMoreRowCount(): number {
  return courseBlockPaletteVisibleEntries("more").length + 1;
}

/** All palette rows for grid-cell “add block” menus (includes embed sub-kinds). */
export function coursePageGridAddBlockMenuEntries(): CourseBlockPaletteEntry[] {
  return PAGE_BLOCK_PALETTE.filter((entry) => entry.paletteHidden !== true);
}
