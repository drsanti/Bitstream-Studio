import type { LayoutNode } from "../../../ui/workbench/types";

function visitVisibleEditorTypes(node: LayoutNode, out: string[]): void {
  if (node.type === "editor") {
    if (node.collapsed !== true) {
      out.push(node.editorType);
    }
    return;
  }
  if (node.type === "tabs") {
    const idx = Math.max(0, Math.min(node.activeIndex, Math.max(0, node.panes.length - 1)));
    const active = node.panes[idx];
    if (active != null) {
      visitVisibleEditorTypes(active, out);
    }
    return;
  }
  if (node.type === "split") {
    visitVisibleEditorTypes(node.first, out);
    visitVisibleEditorTypes(node.second, out);
  }
}

/** Non-collapsed editor types currently mounted in the docked workbench layout. */
export function collectVisibleWorkbenchEditorTypes(layout: LayoutNode): string[] {
  const out: string[] = [];
  visitVisibleEditorTypes(layout, out);
  return out;
}

export function readWorkbenchPaneVisibility(types: readonly string[]): {
  stagePaneVisible: boolean;
  dashboardPaneVisible: boolean;
  flowPaneVisible: boolean;
} {
  const set = new Set(types);
  return {
    stagePaneVisible: set.has("stage"),
    dashboardPaneVisible: set.has("dashboard"),
    flowPaneVisible: set.has("flow"),
  };
}
