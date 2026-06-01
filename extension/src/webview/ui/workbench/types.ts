import React from 'react';

export type EditorType = string;

/** Which workbench edge a collapsed pane docks to (for rail orientation). */
export type CollapseEdge = 'left' | 'right' | 'top' | 'bottom';

export type EditorPaneNode = {
  id: string;
  type: 'editor';
  editorType: EditorType;
  /** When true, pane body is hidden and a narrow rail is shown on `collapseEdge`. */
  collapsed?: boolean;
  /** Parent split ratio to restore when expanding (optional; parent ratio is used if omitted). */
  expandedRatio?: number;
  collapseEdge?: CollapseEdge;
};

export type LayoutNode =
  | {
      id: string;
      type: 'split';
      direction: 'vertical' | 'horizontal';
      ratio: number;
      first: LayoutNode;
      second: LayoutNode;
    }
  | EditorPaneNode
  | {
      id: string;
      type: 'tabs';
      activeIndex: number;
      panes: EditorPaneNode[];
    };

export interface WorkbenchRegistry {
  [key: string]: {
    icon: React.ReactNode;
    label: string;
    component: React.ComponentType<any>;
  };
}
