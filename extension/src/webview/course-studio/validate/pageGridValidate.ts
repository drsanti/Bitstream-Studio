import { dashboardPlacementCellKeys } from "../../sensor-studio/core/dashboard/dashboard-placement";
import type { PageV1 } from "../schemas/page.v1";

export type PageGridOverlap = {
  blockA: string;
  blockB: string;
  cell: string;
};

export function findPageGridOverlaps(page: PageV1): PageGridOverlap[] {
  const cellOwner = new Map<string, string>();
  const overlaps: PageGridOverlap[] = [];

  for (const block of page.blocks) {
    for (const key of dashboardPlacementCellKeys(block.placement)) {
      const owner = cellOwner.get(key);
      if (owner != null && owner !== block.id) {
        overlaps.push({ blockA: owner, blockB: block.id, cell: key });
      } else {
        cellOwner.set(key, block.id);
      }
    }
  }

  return overlaps;
}

export function findDuplicateBlockIds(page: PageV1): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const block of page.blocks) {
    if (seen.has(block.id)) {
      duplicates.push(block.id);
    }
    seen.add(block.id);
  }
  return duplicates;
}

export function collectPageDiagramIds(page: PageV1): string[] {
  return page.blocks
    .filter((block): block is Extract<PageV1["blocks"][number], { kind: "diagram-2d" }> => {
      return block.kind === "diagram-2d";
    })
    .map((block) => block.diagramId);
}

export function collectPageMarkdownUrls(page: PageV1): string[] {
  return page.blocks
    .filter((block): block is Extract<PageV1["blocks"][number], { kind: "markdown" }> => {
      return block.kind === "markdown" && block.url != null && block.url.length > 0;
    })
    .map((block) => block.url!);
}

export function collectPageMarkdownSrcs(page: PageV1): string[] {
  return page.blocks
    .filter((block): block is Extract<PageV1["blocks"][number], { kind: "markdown" }> => {
      return block.kind === "markdown" && block.src != null;
    })
    .map((block) => block.src!);
}

export function collectPageSceneDocumentIds(page: PageV1): string[] {
  return page.blocks
    .filter((block): block is Extract<PageV1["blocks"][number], { kind: "scene-3d" }> => {
      return block.kind === "scene-3d";
    })
    .map((block) => block.documentId);
}
