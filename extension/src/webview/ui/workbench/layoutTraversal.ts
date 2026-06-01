import type { LayoutNode } from './types';

export type EditorPaneNode = Extract<LayoutNode, { type: 'editor' }>;
export type TabsPaneNode = Extract<LayoutNode, { type: 'tabs' }>;

export function isEditorPaneNode(node: LayoutNode): node is EditorPaneNode {
  return node.type === 'editor';
}

export function isTabsPaneNode(node: LayoutNode): node is TabsPaneNode {
  return node.type === 'tabs';
}

export function mapLayout(
  node: LayoutNode,
  fn: (node: LayoutNode) => LayoutNode,
): LayoutNode {
  const next = fn(node);
  if (next.type === 'split') {
    return {
      ...next,
      first: mapLayout(next.first, fn),
      second: mapLayout(next.second, fn),
    };
  }
  if (next.type === 'tabs') {
    return {
      ...next,
      panes: next.panes.map((p) => mapLayout(p, fn) as EditorPaneNode),
    };
  }
  return next;
}

export function findEditorPane(
  node: LayoutNode,
  editorId: string,
): EditorPaneNode | null {
  if (node.type === 'editor') {
    return node.id === editorId ? node : null;
  }
  if (node.type === 'tabs') {
    return node.panes.find((p) => p.id === editorId) ?? null;
  }
  return (
    findEditorPane(node.first, editorId) ?? findEditorPane(node.second, editorId)
  );
}

export function collectEditorPanes(node: LayoutNode): EditorPaneNode[] {
  if (node.type === 'editor') return [node];
  if (node.type === 'tabs') return [...node.panes];
  return [
    ...collectEditorPanes(node.first),
    ...collectEditorPanes(node.second),
  ];
}

/** Primary editor type for a split child (editor, active tab, or first nested pane). */
export function directSplitChildEditorType(node: LayoutNode): string | null {
  if (node.type === 'editor') return node.editorType;
  if (node.type === 'tabs') {
    const idx = Math.max(0, Math.min(node.activeIndex, node.panes.length - 1));
    return node.panes[idx]?.editorType ?? node.panes[0]?.editorType ?? null;
  }
  const panes = collectEditorPanes(node);
  return panes[0]?.editorType ?? null;
}

export function countEditorPanes(node: LayoutNode): number {
  if (node.type === 'editor') return 1;
  if (node.type === 'tabs') return node.panes.length;
  return countEditorPanes(node.first) + countEditorPanes(node.second);
}

export function removeEditorPane(
  node: LayoutNode,
  paneId: string,
): LayoutNode | null {
  if (node.type === 'editor') {
    return node.id === paneId ? null : node;
  }
  if (node.type === 'tabs') {
    const panes = node.panes.filter((p) => p.id !== paneId);
    if (panes.length === 0) return null;
    if (panes.length === 1) return panes[0];
    const activeIndex = Math.min(
      node.activeIndex >= panes.length ? panes.length - 1 : node.activeIndex,
      panes.length - 1,
    );
    return { ...node, panes, activeIndex: Math.max(0, activeIndex) };
  }
  const first = removeEditorPane(node.first, paneId);
  const second = removeEditorPane(node.second, paneId);
  if (first === null) return second;
  if (second === null) return first;
  return { ...node, first, second };
}

export function replaceEditorPane(
  node: LayoutNode,
  paneId: string,
  replacement: LayoutNode,
): LayoutNode {
  if (node.type === 'editor') {
    return node.id === paneId ? replacement : node;
  }
  if (node.type === 'tabs') {
    return {
      ...node,
      panes: node.panes.map((p) =>
        p.id === paneId ? (replacement as EditorPaneNode) : p,
      ),
    };
  }
  return {
    ...node,
    first: replaceEditorPane(node.first, paneId, replacement),
    second: replaceEditorPane(node.second, paneId, replacement),
  };
}
