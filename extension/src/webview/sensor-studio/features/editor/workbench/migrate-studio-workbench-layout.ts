import {
  collectEditorPanes,
  removeEditorPane,
} from "../../../../ui/workbench/layoutTraversal";
import type { LayoutNode } from "../../../../ui/workbench/types";
import {
  STUDIO_TEACHING_TWIN_LAYOUT,
  STUDIO_TWIN_FOCUS_LAYOUT,
} from "./studio-workbench-layout-constants";

const LEGACY_SCOPED_FLOW_TYPES = new Set(["flow-dashboard", "flow-stage"]);

export function studioWorkbenchMigrateEditorType(editorType: string): string {
  if (LEGACY_SCOPED_FLOW_TYPES.has(editorType)) {
    return "flow";
  }
  return editorType;
}

function layoutHasLegacyScopedFlow(layout: LayoutNode): boolean {
  return collectEditorPanes(layout).some((pane) =>
    LEGACY_SCOPED_FLOW_TYPES.has(pane.editorType),
  );
}

function dedupeFlowEditorPanes(layout: LayoutNode): LayoutNode {
  const flowPanes = collectEditorPanes(layout).filter((pane) => pane.editorType === "flow");
  if (flowPanes.length <= 1) {
    return layout;
  }
  let next = layout;
  for (let i = 1; i < flowPanes.length; i += 1) {
    const removed = removeEditorPane(next, flowPanes[i]!.id);
    if (removed != null) {
      next = removed;
    }
  }
  return next;
}

function editorTypesInLayout(layout: LayoutNode): Set<string> {
  return new Set(collectEditorPanes(layout).map((pane) => pane.editorType));
}

/**
 * Normalize layouts from the old twin desk (separate Dashboard/Stage wiring panes)
 * to a single shared Flow strip.
 */
export function migrateStudioWorkbenchLayoutToSingleFlow(layout: LayoutNode): LayoutNode {
  if (!layoutHasLegacyScopedFlow(layout)) {
    return dedupeFlowEditorPanes(layout);
  }

  const types = editorTypesInLayout(layout);
  const hasDashboard = types.has("dashboard");
  const hasStage = types.has("stage");

  if (hasDashboard && hasStage) {
    const useTeaching =
      types.has("stage-outliner") &&
      collectEditorPanes(layout).some((pane) => pane.id.includes("teach"));
    return structuredClone(useTeaching ? STUDIO_TEACHING_TWIN_LAYOUT : STUDIO_TWIN_FOCUS_LAYOUT);
  }

  let next = layout;
  for (const pane of collectEditorPanes(layout)) {
    if (!LEGACY_SCOPED_FLOW_TYPES.has(pane.editorType)) {
      continue;
    }
    const removed = removeEditorPane(next, pane.id);
    if (removed != null) {
      next = removed;
    }
  }
  return dedupeFlowEditorPanes(next);
}
