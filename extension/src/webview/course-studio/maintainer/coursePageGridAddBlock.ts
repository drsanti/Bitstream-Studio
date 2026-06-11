import { toast } from "react-toastify";
import {
  persistNewCourseDiagramToDev,
  registerNewCourseDiagram,
} from "../content/diagramTemplates";
import { readCourseStudioBootstrapModeFromLocation } from "../content/bootstrapCourseStudioBlank";
import { persistCourseStudioSessionDraft } from "../content/courseStudioSessionDraft";
import {
  persistNewCourseSceneToDev,
  prepareNewCourseScene,
} from "../content/sceneTemplates";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";
import { createPageBlock } from "./blockFactory";
import type { CourseBlockPaletteEntry } from "./blockPaletteMeta";
import { findPageBlockPlacementAtAnchor } from "./blockPlacement";
import { suppressCoursePageGridDeselect } from "./coursePageEditorDeselectGuard";

export type CoursePageGridAddBlockDeps = {
  page: PageV1;
  addBlock: (block: PageBlockV1, options?: { recordUndo?: boolean }) => void;
  setBlockSelection: (blockIds: string[]) => void;
  focusAddedScene3dBlock: (blockId: string) => void;
  openHtmlPageBlock: (blockId: string) => void;
};

export function addCoursePageBlockAtGridCell(
  entry: CourseBlockPaletteEntry,
  anchorColumn: number,
  anchorRow: number,
  deps: CoursePageGridAddBlockDeps,
): string | null {
  const placement = findPageBlockPlacementAtAnchor(
    anchorColumn,
    anchorRow,
    entry.defaultSpan,
    deps.page,
  );
  return addCoursePageBlockWithPlacement(entry, placement, deps);
}

export function addCoursePageBlockWithPlacement(
  entry: CourseBlockPaletteEntry,
  placement: GridPlacementV1,
  deps: CoursePageGridAddBlockDeps,
): string | null {
  const { page, addBlock, setBlockSelection, focusAddedScene3dBlock, openHtmlPageBlock } = deps;

  if (entry.kind === "diagram-2d") {
    try {
      const built = registerNewCourseDiagram("blank");
      const block = createPageBlock(entry.kind, page, {
        diagramId: built.diagramId,
        placement,
      });
      suppressCoursePageGridDeselect();
      addBlock(block);
      setBlockSelection([block.id]);
      void persistNewCourseDiagramToDev(built).then((result) => {
        if (!result.ok) {
          toast.warn(
            `Diagram added in memory; dev save failed: ${result.error}. Save the page after fixing the dev API.`,
          );
        }
      });
      return block.id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create diagram block.");
      return null;
    }
  }

  if (entry.kind === "scene-3d") {
    try {
      const built = prepareNewCourseScene("blank");
      const block = createPageBlock(entry.kind, page, {
        documentId: built.documentId,
        placement,
      });
      suppressCoursePageGridDeselect();
      addBlock(block);
      setBlockSelection([block.id]);
      focusAddedScene3dBlock(block.id);
      if (readCourseStudioBootstrapModeFromLocation() === "blank") {
        persistCourseStudioSessionDraft("blank");
      }
      void persistNewCourseSceneToDev(built)
        .then((result) => {
          if (!result.ok) {
            toast.warn(
              `3D Scene added in memory; dev save failed: ${result.error}. Save the page after fixing the dev API.`,
            );
          }
        })
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : "Could not save 3D Scene document.",
          );
        });
      return block.id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create 3D Scene block.");
      return null;
    }
  }

  if (entry.kind === "html-page") {
    const block = createPageBlock(entry.kind, page, { placement });
    suppressCoursePageGridDeselect();
    addBlock(block);
    setBlockSelection([block.id]);
    openHtmlPageBlock(block.id);
    return block.id;
  }

  const block = createPageBlock(entry.kind, page, { placement });
  suppressCoursePageGridDeselect();
  addBlock(block);
  setBlockSelection([block.id]);
  return block.id;
}
