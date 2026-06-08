import type { PageBlockV1 } from "../schemas/page.v1";
import type { PageV1 } from "../schemas/page.v1";
import { DEFAULT_COURSE_3D_SCENE_ID } from "../schemas/course3dScene";
import { findOpenPlacement } from "./blockPlacement";

export type PageBlockKind = PageBlockV1["kind"];

export const PAGE_BLOCK_PALETTE: ReadonlyArray<{
  kind: PageBlockKind;
  label: string;
  defaultSpan: { columnSpan: number; rowSpan: number };
}> = [
  { kind: "heading", label: "Heading", defaultSpan: { columnSpan: 12, rowSpan: 2 } },
  { kind: "callout-info", label: "Callout", defaultSpan: { columnSpan: 6, rowSpan: 2 } },
  { kind: "markdown", label: "Markdown", defaultSpan: { columnSpan: 6, rowSpan: 4 } },
  { kind: "card", label: "Card", defaultSpan: { columnSpan: 4, rowSpan: 2 } },
  { kind: "live-metric", label: "Live metric", defaultSpan: { columnSpan: 4, rowSpan: 3 } },
  { kind: "diagram-2d", label: "Diagram", defaultSpan: { columnSpan: 5, rowSpan: 3 } },
  { kind: "diagram-3d", label: "3D scene", defaultSpan: { columnSpan: 5, rowSpan: 4 } },
];

let blockIdCounter = 0;

function nextBlockId(kind: string): string {
  blockIdCounter += 1;
  return `${kind}-${blockIdCounter}`;
}

export function createPageBlock(
  kind: PageBlockKind,
  page: PageV1,
  options?: { diagramId?: string },
): PageBlockV1 {
  const palette = PAGE_BLOCK_PALETTE.find((entry) => entry.kind === kind);
  const span = palette?.defaultSpan ?? { columnSpan: 4, rowSpan: 2 };
  const placement = findOpenPlacement(page, span);
  const id = nextBlockId(kind);

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
    case "diagram-2d":
      return {
        id,
        kind,
        placement,
        diagramId: options?.diagramId ?? "pilot-bmi-accel-mems",
        caption: "Diagram",
      };
    case "diagram-3d":
      return {
        id,
        kind,
        placement,
        sceneId: DEFAULT_COURSE_3D_SCENE_ID,
        caption: "3D orientation",
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
