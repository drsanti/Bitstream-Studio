import type { GridPlacementV1 } from "../schemas/placement";
import type { PageBlockV1 } from "../schemas/page.v1";
import type { PageV1 } from "../schemas/page.v1";
import {
  COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING,
  COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT,
} from "../schemas/courseLiveBindingDefaults";
import { COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT } from "../schemas/sensorTelemetryCardPreset";
import {
  WIDGET_BOARD_DEFAULT_INNER_GRID,
  createEvCompactWidgetBoardWidgets,
  defaultWidgetBoardAppearance,
} from "../schemas/widgetBoard.v1";
import { findOpenPlacement } from "./blockPlacement";
import { PAGE_BLOCK_PALETTE, type CourseBlockPaletteEntry } from "./blockPaletteMeta";

export type PageBlockKind = PageBlockV1["kind"];

export { PAGE_BLOCK_PALETTE };
export type { CourseBlockPaletteEntry };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Allocate `kind-N` ids that do not collide with blocks already on the page. */
export function nextUniquePageBlockId(
  kind: string,
  existingBlocks: readonly { id: string }[],
): string {
  const existingIds = new Set(existingBlocks.map((block) => block.id));
  const prefix = `${kind}-`;
  const numericSuffix = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`);

  let maxSuffix = 0;
  for (const id of existingIds) {
    const match = id.match(numericSuffix);
    if (match) {
      maxSuffix = Math.max(maxSuffix, Number.parseInt(match[1]!, 10));
    }
  }

  let candidate = maxSuffix + 1;
  while (existingIds.has(`${prefix}${candidate}`)) {
    candidate += 1;
  }
  return `${prefix}${candidate}`;
}

/** New unique block id for duplicate / palette add. */
export function generatePageBlockId(
  kind: string,
  existingBlocks: readonly { id: string }[] = [],
): string {
  return nextUniquePageBlockId(kind, existingBlocks);
}

export function createPageBlock(
  kind: PageBlockKind,
  page: PageV1,
  options?: { diagramId?: string; documentId?: string; placement?: GridPlacementV1 },
): PageBlockV1 {
  const palette = PAGE_BLOCK_PALETTE.find((entry) => entry.kind === kind);
  const span = palette?.defaultSpan ?? { columnSpan: 4, rowSpan: 2 };
  const placement = options?.placement ?? findOpenPlacement(page, span);
  const id = nextUniquePageBlockId(kind, page.blocks);

  switch (kind) {
    case "heading":
      return {
        id,
        kind,
        placement,
        eyebrow: "Section",
        title: "New heading",
        subtitle: "Subtitle",
      };
    case "callout-info":
    case "callout-warning":
    case "callout-danger":
    case "callout-tip":
      return {
        id,
        kind,
        placement,
        title: "Note",
        body: "Callout body text.",
      };
    case "markdown":
      return {
        id,
        kind,
        placement,
        markdown: "## New section\n\nEdit markdown in the inspector.",
      };
    case "card":
      return {
        id,
        kind,
        placement,
        title: "Card title",
        body: "Card body.",
      };
    case "live-metric":
      return {
        id,
        kind,
        placement,
        title: "Live tri-axis",
      };
    case "dashboard-widget":
      return {
        id,
        kind,
        placement,
        widgetKind: "text",
        style: { ...COURSE_DASHBOARD_WIDGET_TEXT_STYLE_DEFAULT },
        binding: { ...COURSE_DASHBOARD_WIDGET_DEFAULT_BINDING },
        title: "Live value",
      };
    case "widget-board":
      return {
        id,
        kind,
        placement: { ...placement, columnSpan: Math.max(placement.columnSpan, 8), rowSpan: Math.max(placement.rowSpan, 5) },
        appearance: defaultWidgetBoardAppearance(),
        grid: { ...WIDGET_BOARD_DEFAULT_INNER_GRID },
        widgets: createEvCompactWidgetBoardWidgets(),
      };
    case "sensor-telemetry-card":
      return {
        id,
        kind,
        placement,
        preset: COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT,
      };
    case "diagram-2d": {
      const diagramId = options?.diagramId;
      if (diagramId == null || diagramId.length === 0) {
        throw new Error("diagram-2d blocks require a diagramId from prepareNewCourseDiagram().");
      }
      return {
        id,
        kind,
        placement,
        diagramId,
        caption: "Diagram",
      };
    }
    case "scene-3d": {
      const documentId = options?.documentId;
      if (documentId == null || documentId.length === 0) {
        throw new Error("scene-3d blocks require a documentId from registerNewCourseScene().");
      }
      return {
        id,
        kind,
        placement,
        documentId,
        caption: "3D Scene",
      };
    }
    case "image":
      return {
        id,
        kind,
        placement,
        src: "https://placehold.co/800x450/1a1a1c/71717a?text=Image",
        alt: "Placeholder image",
        caption: "Image caption",
        fit: "contain",
      };
    case "code":
      return {
        id,
        kind,
        placement,
        language: "typescript",
        code: "// Edit code in the inspector\nconsole.log('Hello, Course Studio');",
        caption: "Code sample",
      };
    case "youtube":
      return {
        id,
        kind,
        placement,
        url: "https://www.youtube.com/watch?v=J---aiyznGQ",
        caption: "Video caption",
      };
    case "iframe":
      return {
        id,
        kind,
        placement,
        src: "https://tesaiot.dev/",
      };
    case "html-page":
      return {
        id,
        kind,
        placement,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Demo</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.25rem; color: #e4e4e7; background: #18181b; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p { margin: 0; color: #a1a1aa; }
  </style>
</head>
<body>
  <h1>HTML page</h1>
  <p>Edit in the HTML Editor workbench pane.</p>
</body>
</html>`,
      };
    default:
      return {
        id,
        kind: "card",
        placement,
        body: "Block",
      };
  }
}
