import type { LayoutNode } from "./types";
import {
  collectCollapsedEditorIds,
  collapseEditorPane,
  expandEditorPane,
  findEditorNode,
} from "./utils";

export function cycleCollapsedPaneFocus(
  collapsedIds: string[],
  currentFocusId: string | null,
  direction: 1 | -1,
): string | null {
  if (collapsedIds.length === 0) {
    return null;
  }
  if (!currentFocusId || !collapsedIds.includes(currentFocusId)) {
    return collapsedIds[direction === 1 ? 0 : collapsedIds.length - 1];
  }
  const index = collapsedIds.indexOf(currentFocusId);
  const next = (index + direction + collapsedIds.length) % collapsedIds.length;
  return collapsedIds[next] ?? null;
}

export function resolveCollapseTargetPaneId(
  layout: LayoutNode,
  activePaneId: string | null,
): string | null {
  if (!activePaneId) {
    return null;
  }
  const editor = findEditorNode(layout, activePaneId);
  if (!editor || editor.collapsed) {
    return null;
  }
  return activePaneId;
}

export function resolveExpandTargetPaneId(
  layout: LayoutNode,
  activePaneId: string | null,
  collapsedFocusId: string | null,
): string | null {
  const collapsed = collectCollapsedEditorIds(layout);
  if (collapsed.length === 0) {
    return null;
  }

  if (activePaneId) {
    const active = findEditorNode(layout, activePaneId);
    if (active?.collapsed) {
      return activePaneId;
    }
  }

  if (collapsedFocusId && collapsed.includes(collapsedFocusId)) {
    return collapsedFocusId;
  }

  return collapsed[0] ?? null;
}

export function applyWorkbenchCollapse(layout: LayoutNode, paneId: string): LayoutNode {
  return collapseEditorPane(layout, paneId);
}

export function applyWorkbenchExpand(layout: LayoutNode, paneId: string): LayoutNode {
  return expandEditorPane(layout, paneId);
}
