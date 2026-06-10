import type { PageBlockKind } from "./blockFactory";

export type CourseBlockPaletteCategory = "structure" | "content" | "live" | "visual" | "embed";

export type CourseBlockPaletteIconId =
  | "heading"
  | "callout"
  | "markdown"
  | "card"
  | "live-metric"
  | "dashboard-widget"
  | "sensor-telemetry-card"
  | "diagram"
  | "scene-3d"
  | "image"
  | "code"
  | "youtube"
  | "iframe";

export type CourseBlockPaletteEntry = {
  kind: PageBlockKind;
  label: string;
  description: string;
  category: CourseBlockPaletteCategory;
  icon: CourseBlockPaletteIconId;
  defaultSpan: { columnSpan: number; rowSpan: number };
  accentClassName?: string;
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

export const PAGE_BLOCK_PALETTE: readonly CourseBlockPaletteEntry[] = [
  {
    kind: "heading",
    label: "Heading",
    description: "Title row",
    category: "structure",
    icon: "heading",
    defaultSpan: { columnSpan: 12, rowSpan: 2 },
  },
  {
    kind: "markdown",
    label: "Markdown",
    description: "Theory / inline or remote URL",
    category: "content",
    icon: "markdown",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
  },
  {
    kind: "card",
    label: "Card",
    description: "Short copy",
    category: "content",
    icon: "card",
    defaultSpan: { columnSpan: 4, rowSpan: 2 },
  },
  {
    kind: "callout-info",
    label: "Callout",
    description: "Info admonition",
    category: "content",
    icon: "callout",
    defaultSpan: { columnSpan: 6, rowSpan: 2 },
    accentClassName: "text-sky-400/90",
  },
  {
    kind: "code",
    label: "Code",
    description: "Syntax snippet",
    category: "content",
    icon: "code",
    defaultSpan: { columnSpan: 6, rowSpan: 3 },
  },
  {
    kind: "image",
    label: "Image",
    description: "Photo or diagram",
    category: "content",
    icon: "image",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
  },
  {
    kind: "live-metric",
    label: "Live metric",
    description: "Tri-axis widget",
    category: "live",
    icon: "live-metric",
    defaultSpan: { columnSpan: 4, rowSpan: 3 },
    accentClassName: "text-amber-400/90",
  },
  {
    kind: "dashboard-widget",
    label: "Dashboard widget",
    description: "Gauge, bar, numeric, LED, status",
    category: "live",
    icon: "dashboard-widget",
    defaultSpan: { columnSpan: 3, rowSpan: 3 },
    accentClassName: "text-cyan-400/90",
  },
  {
    kind: "sensor-telemetry-card",
    label: "Sensor card",
    description: "One Telemetry Data card (Euler, pressure, …)",
    category: "live",
    icon: "sensor-telemetry-card",
    defaultSpan: { columnSpan: 5, rowSpan: 3 },
    accentClassName: "text-emerald-400/90",
  },
  {
    kind: "diagram-2d",
    label: "Diagram",
    description: "Konva live canvas",
    category: "visual",
    icon: "diagram",
    defaultSpan: { columnSpan: 5, rowSpan: 3 },
    accentClassName: "text-cyan-400/90",
  },
  {
    kind: "scene-3d",
    label: "3D Scene",
    description: "Editable GLB scene document",
    category: "visual",
    icon: "scene-3d",
    defaultSpan: { columnSpan: 5, rowSpan: 4 },
    accentClassName: "text-violet-400/90",
  },
  {
    kind: "youtube",
    label: "YouTube",
    description: "Video embed",
    category: "embed",
    icon: "youtube",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
    accentClassName: "text-rose-400/90",
  },
  {
    kind: "iframe",
    label: "iFrame",
    description: "External page",
    category: "embed",
    icon: "iframe",
    defaultSpan: { columnSpan: 6, rowSpan: 4 },
    accentClassName: "text-emerald-400/90",
  },
];
