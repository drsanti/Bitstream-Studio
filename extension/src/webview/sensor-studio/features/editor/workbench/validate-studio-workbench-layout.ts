import type { LayoutNode } from "../../../../ui/workbench/types";
import { findEditorPane } from "../../../../ui/workbench/layoutTraversal";
import { validateLayoutTree } from "../../../../ui/workbench/layoutValidateCore";
import {
  collapseEditorPane,
  expandEditorPane,
  findEditorPaneId,
  isCollapsedEditor,
} from "../../../../ui/workbench/utils";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "./default-studio-workbench-layout";
import {
  migrateStudioWorkbenchLayoutToSingleFlow,
  studioWorkbenchMigrateEditorType,
} from "./migrate-studio-workbench-layout";
import {
  dedupeStudioInspectorEditorPanes,
  stripStudioInspectorPinnedPaneFromLayout,
} from "./studio-inspector-pinned-pane-layout";

const STUDIO_KNOWN_EDITOR_TYPES = [
  "library",
  "model-outliner",
  "assets",
  "stage",
  "dashboard",
  "flow",
  "stage-outliner",
  "inspector",
  "inspector-pinned",
] as const;

export type StudioWorkbenchEditorType = (typeof STUDIO_KNOWN_EDITOR_TYPES)[number];

export function validateStudioWorkbenchLayout(raw: unknown): LayoutNode {
  return validateLayoutTree(raw, {
    fallback: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
    knownEditorTypes: new Set(STUDIO_KNOWN_EDITOR_TYPES),
    fallbackEditorType: "flow",
    migrateEditorType: studioWorkbenchMigrateEditorType,
    postMigrate: (layout) =>
      dedupeStudioInspectorEditorPanes(
        stripStudioInspectorPinnedPaneFromLayout(migrateStudioWorkbenchLayoutToSingleFlow(layout)),
      ),
  });
}

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
