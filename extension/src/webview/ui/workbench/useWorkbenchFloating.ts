import { useCallback, useState, type RefObject } from 'react';
import type { FloatingWorkbenchPane } from './floatingTypes';
import type { LayoutNode } from './types';
import type { TRNWorkbenchHandle, TRNWorkbenchProps } from './TRNWorkbench';
import {
  canCloseEditorPane,
  findEditorNode,
  type EditorLayoutNode,
} from './utils';
import { removeEditorPane } from './layoutTraversal';
import {
  DEFAULT_FLOAT_PANE_HEIGHT,
  DEFAULT_FLOAT_PANE_WIDTH,
  floatPanePositionFromPointer,
} from './workbenchFloat';

export interface UseWorkbenchFloatingOptions {
  layout: LayoutNode;
  onLayoutChange: (layout: LayoutNode) => void;
  /** When false, floating APIs no-op (workbench-only mode). */
  enabled?: boolean;
  onDetachRejected?: () => void;
}

export interface WorkbenchFloatingBindings {
  floatingPanes: FloatingWorkbenchPane[];
  frontPaneId: string | null;
  activePaneId: string | null;
  setActivePaneId: (paneId: string | null) => void;
  detachPaneToFloat: (paneId: string, clientX: number, clientY: number) => void;
  closeFloatingPane: (paneId: string) => void;
  clearAllFloatingPanes: () => void;
  moveFloatingPane: (paneId: string, x: number, y: number) => void;
  resizeFloatingPane: (paneId: string, width: number, height: number) => void;
  focusFloatingPane: (paneId: string) => void;
  getFloatingEditor: (paneId: string) => EditorLayoutNode | null;
  dockFloatingPane: (paneId: string, nextLayout: LayoutNode) => void;
  /** Spread onto {@link TRNWorkbench} together with layout/registry/onLayoutChange. */
  workbenchProps: Pick<
    TRNWorkbenchProps,
    | 'canDetachPane'
    | 'onDetachToFloat'
    | 'getFloatingEditor'
    | 'onFloatingPaneDocked'
    | 'onPaneActivate'
  >;
  /** Props for {@link FloatingWorkbenchLayer} (registry + ref passed separately). */
  layerProps: (workbenchRef: RefObject<TRNWorkbenchHandle | null>) => {
    panes: FloatingWorkbenchPane[];
    frontPaneId: string | null;
    onFocusPane: (paneId: string) => void;
    onClosePane: (paneId: string) => void;
    onMovePane: (paneId: string, x: number, y: number) => void;
    onResizePane: (paneId: string, width: number, height: number) => void;
    onDockDragStart: (paneId: string) => void;
  };
}

export function useWorkbenchFloating({
  layout,
  onLayoutChange,
  enabled = true,
  onDetachRejected,
}: UseWorkbenchFloatingOptions): WorkbenchFloatingBindings {
  const [floatingPanes, setFloatingPanes] = useState<FloatingWorkbenchPane[]>([]);
  const [frontPaneId, setFrontPaneId] = useState<string | null>(null);
  const [activePaneId, setActivePaneId] = useState<string | null>(null);

  const detachPaneToFloat = useCallback(
    (paneId: string, clientX: number, clientY: number) => {
      if (!enabled) return;
      if (!canCloseEditorPane(layout, paneId)) {
        onDetachRejected?.();
        return;
      }
      const editor = findEditorNode(layout, paneId);
      if (!editor) return;
      const nextLayout = removeEditorPane(layout, paneId);
      if (!nextLayout) return;
      const pos = floatPanePositionFromPointer(clientX, clientY);
      const floating: FloatingWorkbenchPane = {
        id: editor.id,
        editorType: editor.editorType,
        x: pos.x,
        y: pos.y,
        width: DEFAULT_FLOAT_PANE_WIDTH,
        height: DEFAULT_FLOAT_PANE_HEIGHT,
      };
      onLayoutChange(nextLayout);
      setFloatingPanes((prev) => [...prev, floating]);
      setFrontPaneId(floating.id);
      setActivePaneId(null);
    },
    [enabled, layout, onDetachRejected, onLayoutChange],
  );

  const closeFloatingPane = useCallback((paneId: string) => {
    setFloatingPanes((prev) => {
      const next = prev.filter((p) => p.id !== paneId);
      setFrontPaneId((front) => (front === paneId ? next[0]?.id ?? null : front));
      return next;
    });
  }, []);

  const moveFloatingPane = useCallback((paneId: string, x: number, y: number) => {
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - margin);
    setFloatingPanes((prev) =>
      prev.map((p) =>
        p.id === paneId
          ? {
              ...p,
              x: Math.min(maxX - 80, Math.max(margin, x)),
              y: Math.min(maxY - 40, Math.max(margin, y)),
            }
          : p,
      ),
    );
  }, []);

  const resizeFloatingPane = useCallback((paneId: string, width: number, height: number) => {
    setFloatingPanes((prev) =>
      prev.map((p) => (p.id === paneId ? { ...p, width, height } : p)),
    );
  }, []);

  const focusFloatingPane = useCallback((paneId: string) => {
    setFrontPaneId(paneId);
  }, []);

  const getFloatingEditor = useCallback(
    (paneId: string): EditorLayoutNode | null => {
      const pane = floatingPanes.find((p) => p.id === paneId);
      if (!pane) return null;
      return { id: pane.id, type: 'editor', editorType: pane.editorType };
    },
    [floatingPanes],
  );

  const dockFloatingPane = useCallback(
    (paneId: string, nextLayout: LayoutNode) => {
      onLayoutChange(nextLayout);
      setFloatingPanes((prev) => prev.filter((p) => p.id !== paneId));
      setFrontPaneId((front) => (front === paneId ? null : front));
      setActivePaneId(paneId);
    },
    [onLayoutChange],
  );

  const workbenchProps: WorkbenchFloatingBindings['workbenchProps'] = {
    onPaneActivate: setActivePaneId,
    canDetachPane: enabled
      ? (paneId) => canCloseEditorPane(layout, paneId)
      : undefined,
    onDetachToFloat: enabled ? detachPaneToFloat : undefined,
    getFloatingEditor: enabled ? getFloatingEditor : undefined,
    onFloatingPaneDocked: enabled ? dockFloatingPane : undefined,
  };

  const layerProps: WorkbenchFloatingBindings['layerProps'] = (workbenchRef) => ({
    panes: floatingPanes,
    frontPaneId,
    onFocusPane: focusFloatingPane,
    onClosePane: closeFloatingPane,
    onMovePane: moveFloatingPane,
    onResizePane: resizeFloatingPane,
    onDockDragStart: (paneId) => {
      const pane = floatingPanes.find((p) => p.id === paneId);
      if (!pane) return;
      workbenchRef.current?.startDockDrag(paneId, pane.editorType, { fromFloat: true });
    },
  });

  const clearAllFloatingPanes = useCallback(() => {
    setFloatingPanes([]);
    setFrontPaneId(null);
  }, []);

  return {
    floatingPanes,
    frontPaneId,
    activePaneId,
    setActivePaneId,
    detachPaneToFloat,
    closeFloatingPane,
    clearAllFloatingPanes,
    moveFloatingPane,
    resizeFloatingPane,
    focusFloatingPane,
    getFloatingEditor,
    dockFloatingPane,
    workbenchProps,
    layerProps,
  };
}
