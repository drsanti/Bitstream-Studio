import { v4 as uuidv4 } from "uuid";
import type { LayoutNode } from "../../../../ui/workbench/types";
import {
  collectEditorPanes,
  findEditorPane,
  removeEditorPane,
  replaceEditorPane,
} from "../../../../ui/workbench/layoutTraversal";
import { closeNode, findEditorPaneId } from "../../../../ui/workbench/utils";
import { readInspectorDualPaneLayout } from "../components/inspector/inspector-dual-pane-ui-persistence";

export const STUDIO_INSPECTOR_PINNED_EDITOR_TYPE = "inspector-pinned";

const PREFERRED_INSPECTOR_PANE_IDS = ["pane-inspector", "preset-inspector"];

function pickCanonicalInspectorPane(
  panes: ReturnType<typeof collectEditorPanes>,
): (typeof panes)[number] | null {
  if (panes.length === 0) {
    return null;
  }
  const preferred = panes.find((pane) => PREFERRED_INSPECTOR_PANE_IDS.includes(pane.id));
  if (preferred != null) {
    return preferred;
  }
  const preset = panes.find((pane) => pane.id.startsWith("preset-inspector"));
  return preset ?? panes[0] ?? null;
}

function dedupeEditorType(
  layout: LayoutNode,
  editorType: string,
  pickCanonical: (panes: ReturnType<typeof collectEditorPanes>) => (typeof panes)[number] | null,
): LayoutNode {
  const matches = collectEditorPanes(layout).filter((pane) => pane.editorType === editorType);
  if (matches.length <= 1) {
    return layout;
  }
  const keep = pickCanonical(matches);
  if (keep == null) {
    return layout;
  }
  let next = layout;
  for (const pane of matches) {
    if (pane.id === keep.id) {
      continue;
    }
    const removed = removeEditorPane(next, pane.id);
    if (removed != null) {
      next = removed;
    }
  }
  return next;
}

/** At most one active inspector and one pinned inspector in the workbench tree. */
export function dedupeStudioInspectorEditorPanes(layout: LayoutNode): LayoutNode {
  let next = dedupeEditorType(layout, "inspector", pickCanonicalInspectorPane);
  next = dedupeEditorType(next, STUDIO_INSPECTOR_PINNED_EDITOR_TYPE, (panes) => panes[0] ?? null);
  return next;
}

export function countStudioInspectorEditorPanes(layout: LayoutNode): {
  inspector: number;
  pinned: number;
} {
  const panes = collectEditorPanes(layout);
  return {
    inspector: panes.filter((pane) => pane.editorType === "inspector").length,
    pinned: panes.filter((pane) => pane.editorType === STUDIO_INSPECTOR_PINNED_EDITOR_TYPE)
      .length,
  };
}

export function normalizeStudioInspectorWorkbenchLayout(
  layout: LayoutNode,
  needsPinnedWorkbenchPane: boolean,
): LayoutNode {
  let next = dedupeStudioInspectorEditorPanes(layout);
  if (needsPinnedWorkbenchPane) {
    next = ensureStudioInspectorPinnedPane(next);
  } else {
    next = removeStudioInspectorPinnedPane(next);
  }
  return dedupeStudioInspectorEditorPanes(next);
}

export function hasStudioInspectorPinnedPane(layout: LayoutNode): boolean {
  return findEditorPaneId(layout, STUDIO_INSPECTOR_PINNED_EDITOR_TYPE) != null;
}

/**
 * Split the primary inspector column: pinned inspector on top, active inspector below.
 * Both use full workbench PaneFrame chrome.
 */
export function ensureStudioInspectorPinnedPane(layout: LayoutNode): LayoutNode {
  if (hasStudioInspectorPinnedPane(layout)) {
    return layout;
  }
  const inspectorId = findEditorPaneId(layout, "inspector");
  if (inspectorId == null) {
    return layout;
  }
  const inspectorPane = findEditorPane(layout, inspectorId);
  if (inspectorPane == null) {
    return layout;
  }
  const ratio = readInspectorDualPaneLayout().primaryRatio;
  const replacement: LayoutNode = {
    id: uuidv4(),
    type: "split",
    direction: "vertical",
    ratio,
    first: {
      id: uuidv4(),
      type: "editor",
      editorType: STUDIO_INSPECTOR_PINNED_EDITOR_TYPE,
    },
    second: { ...inspectorPane },
  };
  return replaceEditorPane(layout, inspectorId, replacement);
}

export function removeStudioInspectorPinnedPane(layout: LayoutNode): LayoutNode {
  const pinnedId = findEditorPaneId(layout, STUDIO_INSPECTOR_PINNED_EDITOR_TYPE);
  if (pinnedId == null) {
    return layout;
  }
  return closeNode(layout, pinnedId);
}

/** Saved layouts must not keep a pinned inspector pane across sessions. */
export function stripStudioInspectorPinnedPaneFromLayout(layout: LayoutNode): LayoutNode {
  if (!hasStudioInspectorPinnedPane(layout)) {
    return layout;
  }
  return removeStudioInspectorPinnedPane(layout);
}
