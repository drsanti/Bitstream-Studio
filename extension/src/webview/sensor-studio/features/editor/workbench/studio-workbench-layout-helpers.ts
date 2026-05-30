import type { MutableRefObject } from "react";
import type { LayoutNode } from "../../../../ui/workbench";
import { updateNodeRatio } from "../../../../ui/workbench";

export type StudioWorkbenchCollapsibleEditor = "library" | "inspector";

type ParentHit = {
  splitId: string;
  /** The collapsible editor is the `first` child of this split. */
  isFirst: boolean;
};

function findParentSplitForEditorType(
  node: LayoutNode,
  editorType: string,
  parent: Extract<LayoutNode, { type: "split" }> | null = null,
  branch: "first" | "second" | null = null,
): ParentHit | null {
  if (node.type === "editor" && node.editorType === editorType && parent != null && branch != null) {
    return { splitId: parent.id, isFirst: branch === "first" };
  }
  if (node.type === "split") {
    return (
      findParentSplitForEditorType(node.first, editorType, node, "first") ??
      findParentSplitForEditorType(node.second, editorType, node, "second")
    );
  }
  return null;
}

const RAIL_FRACTION = 0.04;

/**
 * Collapse or expand the column/row that hosts an editor leaf by nudging the parent split ratio.
 * When the editor is the **first** child, a collapsed layout uses a small ratio (thin first pane).
 * When it is the **second** child, collapsed uses a ratio near 1 (thin second pane).
 */
export function toggleEditorTypePaneCollapse(
  layout: LayoutNode,
  editorType: StudioWorkbenchCollapsibleEditor,
  collapsed: boolean,
  stash: MutableRefObject<Partial<Record<StudioWorkbenchCollapsibleEditor, number>>>,
): LayoutNode {
  const hit = findParentSplitForEditorType(layout, editorType);
  if (hit == null) {
    return layout;
  }
  const { splitId, isFirst } = hit;

  if (collapsed) {
    const current = readSplitRatio(layout, splitId);
    if (current != null) {
      stash.current[editorType] = current;
    }
    const nextRatio = isFirst ? RAIL_FRACTION : 1 - RAIL_FRACTION;
    return updateNodeRatio(layout, splitId, nextRatio);
  }

  const restored = stash.current[editorType];
  const fallback = isFirst ? 0.22 : 0.28;
  const nextRatio =
    restored != null && restored > RAIL_FRACTION + 0.01 && restored < 1 - RAIL_FRACTION - 0.01
      ? restored
      : fallback;
  return updateNodeRatio(layout, splitId, nextRatio);
}

function readSplitRatio(node: LayoutNode, splitId: string): number | null {
  if (node.id === splitId && node.type === "split") {
    return node.ratio;
  }
  if (node.type === "split") {
    return readSplitRatio(node.first, splitId) ?? readSplitRatio(node.second, splitId);
  }
  return null;
}
