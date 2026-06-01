import type { LayoutNode } from "../../../../ui/workbench/types";
import { findEditorPane } from "../../../../ui/workbench/layoutTraversal";
import {
  collapseEditorPane,
  expandEditorPane,
  findEditorPaneId,
  isCollapsedEditor,
} from "../../../../ui/workbench/utils";
import { createWorkbenchLayoutValidator } from "../../../../ui/workbench/create-workbench-layout-validator";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "./default-studio-workbench-layout";

const STUDIO_KNOWN_EDITOR_TYPES = ["library", "assets", "flow", "inspector"] as const;

export type StudioWorkbenchEditorType = (typeof STUDIO_KNOWN_EDITOR_TYPES)[number];

export const validateStudioWorkbenchLayout = createWorkbenchLayoutValidator(
  DEFAULT_STUDIO_WORKBENCH_LAYOUT,
  STUDIO_KNOWN_EDITOR_TYPES,
  "flow",
);

/** Toggle collapse rail for a pane identified by editor type (Alt+P / Alt+I shortcuts). */
export function toggleStudioPaneCollapseByEditorType(
  layout: LayoutNode,
  editorType: StudioWorkbenchEditorType,
): LayoutNode {
  const paneId = findEditorPaneId(layout, editorType);
  if (paneId == null) {
    return layout;
  }
  const pane = findEditorPane(layout, paneId);
  if (pane == null) {
    return layout;
  }
  return isCollapsedEditor(pane)
    ? expandEditorPane(layout, paneId)
    : collapseEditorPane(layout, paneId);
}
