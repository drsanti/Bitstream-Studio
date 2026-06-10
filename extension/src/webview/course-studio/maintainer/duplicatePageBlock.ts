import { toast } from "react-toastify";
import {
  cloneRegisteredCourseDiagram,
  persistNewCourseDiagramToDev,
} from "../content/diagramTemplates";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import { generatePageBlockId } from "./blockFactory";
import { findDuplicateBlockPlacement } from "./blockPlacement";

export function duplicatePageBlock(
  page: PageV1,
  sourceBlock: PageBlockV1,
): PageBlockV1 | null {
  const copy = structuredClone(sourceBlock) as PageBlockV1;
  copy.id = generatePageBlockId(copy.kind, page.blocks);
  copy.placement = findDuplicateBlockPlacement(page, sourceBlock.placement);

  if (copy.kind === "diagram-2d") {
    const clonedDiagram = cloneRegisteredCourseDiagram(sourceBlock.diagramId);
    if (clonedDiagram == null) {
      return null;
    }
    copy.diagramId = clonedDiagram.diagramId;
    void persistNewCourseDiagramToDev(clonedDiagram).then((result) => {
      if (!result.ok) {
        toast.warn(
          `Diagram duplicated in memory; dev save failed: ${result.error}. Save the page after fixing the dev API.`,
        );
      }
    });
  }

  return copy;
}

export function duplicatePageBlockFromId(
  page: PageV1,
  sourceBlockId: string,
): PageBlockV1 | null {
  const source = page.blocks.find((block) => block.id === sourceBlockId);
  if (source == null) {
    return null;
  }
  return duplicatePageBlock(page, source);
}
