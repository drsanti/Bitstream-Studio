import { findEditorPane } from "./layoutTraversal";
import type { LayoutNode } from "./types";
import { findParentTabsOfEditor } from "./utils";

/** Full-workbench layout showing only `paneId` (tab group or solo editor). */
export function buildMaximizedLayoutRoot(
  layout: LayoutNode,
  paneId: string,
): LayoutNode | null {
  const editor = findEditorPane(layout, paneId);
  if (editor == null) {
    return null;
  }

  const tabs = findParentTabsOfEditor(layout, paneId);
  if (tabs != null) {
    const activeIndex = tabs.panes.findIndex((pane) => pane.id === paneId);
    return {
      ...tabs,
      activeIndex: activeIndex >= 0 ? activeIndex : tabs.activeIndex,
      panes: tabs.panes.map((pane) => ({ ...pane, collapsed: false })),
    };
  }

  return { ...editor, collapsed: false };
}
