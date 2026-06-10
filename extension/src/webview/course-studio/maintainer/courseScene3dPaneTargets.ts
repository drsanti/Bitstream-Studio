import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import { coursePageBlockSelectionLabel } from "./coursePageBlockSelectionLabel";

export type CourseScene3dPaneTarget = {
  blockId: string;
  kind: "scene-3d";
  label: string;
};

export function listCourseScene3dPaneTargets(page: PageV1): CourseScene3dPaneTarget[] {
  const out: CourseScene3dPaneTarget[] = [];

  for (const block of page.blocks) {
    if (block.kind === "scene-3d") {
      out.push({
        blockId: block.id,
        kind: block.kind,
        label: coursePageBlockSelectionLabel(block),
      });
    }
  }

  return out;
}

export function findScene3dBlockByDocumentId(
  page: PageV1,
  documentId: string,
): Extract<PageBlockV1, { kind: "scene-3d" }> | null {
  const block = page.blocks.find(
    (entry): entry is Extract<PageBlockV1, { kind: "scene-3d" }> =>
      entry.kind === "scene-3d" && entry.documentId === documentId,
  );
  return block ?? null;
}
