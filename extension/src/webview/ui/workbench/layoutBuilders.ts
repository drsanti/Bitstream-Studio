import { v4 as uuidv4 } from 'uuid';
import type { CollapseEdge, EditorPaneNode, LayoutNode } from './types';

export function createEditorPane(
  editorType: string,
  options?: {
    id?: string;
    collapsed?: boolean;
    collapseEdge?: CollapseEdge;
    expandedRatio?: number;
  },
): EditorPaneNode {
  return {
    id: options?.id ?? uuidv4(),
    type: 'editor',
    editorType,
    collapsed: options?.collapsed,
    collapseEdge: options?.collapseEdge,
    expandedRatio: options?.expandedRatio,
  };
}

export function createSplit(
  first: LayoutNode,
  second: LayoutNode,
  direction: 'horizontal' | 'vertical',
  ratio = 0.5,
  id?: string,
): Extract<LayoutNode, { type: 'split' }> {
  return {
    id: id ?? uuidv4(),
    type: 'split',
    direction,
    ratio,
    first,
    second,
  };
}

export function createTabs(
  panes: EditorPaneNode[],
  activeIndex = 0,
  id?: string,
): Extract<LayoutNode, { type: 'tabs' }> {
  return {
    id: id ?? uuidv4(),
    type: 'tabs',
    activeIndex: Math.max(0, Math.min(activeIndex, panes.length - 1)),
    panes,
  };
}
