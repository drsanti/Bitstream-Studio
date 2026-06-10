import type { LucideIcon } from "lucide-react";
import { Box, CodeXml, FileText, PanelRight, PenLine } from "lucide-react";
import type { CourseWorkbenchEditorType } from "../workbench/course-workbench-focus.store";
import type { PageBlockV1 } from "../schemas/page.v1";

export function courseWorkbenchEditorTypeForBlockKind(
  kind: string,
): CourseWorkbenchEditorType | null {
  switch (kind) {
    case "diagram-2d":
      return "diagram";
    case "markdown":
      return "markdown";
    case "html-page":
      return "html-page";
    case "scene-3d":
      return "scene-3d";
    default:
      return null;
  }
}

/** Block kind → workbench editor pane (diagram-2d always opens Diagram editor). */
export function resolveCourseWorkbenchEditorTypeForBlock(
  block: PageBlockV1,
): CourseWorkbenchEditorType | null {
  return courseWorkbenchEditorTypeForBlockKind(block.kind);
}

export function courseWorkbenchOpenLabelForBlockKind(kind: string): string {
  switch (kind) {
    case "diagram-2d":
      return "Open diagram editor";
    case "markdown":
      return "Open markdown editor";
    case "html-page":
      return "Open HTML Editor";
    case "scene-3d":
      return "Open 3D Scene Editor";
    default:
      return "Open Inspector";
  }
}

export function courseWorkbenchOpenLabelForBlock(block: PageBlockV1): string {
  return courseWorkbenchOpenLabelForBlockKind(block.kind);
}

export function courseWorkbenchOpenIconForBlock(block: PageBlockV1): LucideIcon {
  switch (resolveCourseWorkbenchEditorTypeForBlock(block)) {
    case "scene-3d":
      return Box;
    case "diagram":
      return PenLine;
    case "markdown":
      return FileText;
    case "html-page":
      return CodeXml;
    default:
      return PanelRight;
  }
}
