import {
  useRef,
  useState,
  useEffect,
  type ReactNode,
  memo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { LayoutNode, WorkbenchRegistry } from './types';
import type { PaneDockDragState, PaneDockHoverState } from './paneDock';
import type { PaneDockZone } from './paneDock';
import { workbenchGlobalZoneAtPoint } from './paneDock';
import { WorkbenchGlobalDockOverlay } from './WorkbenchGlobalDockOverlay';
import { WorkbenchFloatDetachHint } from './WorkbenchFloatDetachHint';
import { isPointerOutsideElement } from './workbenchFloat';
import { PaneFrame } from './PaneFrame';
import { WorkbenchSplitHost } from './WorkbenchSplitHost';
import { PaneTabGroup } from './PaneTabGroup';
import { CollapsedPaneRail } from './CollapsedPaneRail';
import {
  WorkbenchDockDragLayer,
  registryLabel,
} from './WorkbenchDockDragLayer';
import {
  splitNode,
  closeNode,
  changeNodeType,
  collapseEditorPane,
  expandEditorPane,
  reorderCollapsedInSplit,
  dockEditorPane,
  dockEditorPaneAtWorkbenchEdge,
  dockExtractedEditorPane,
  dockExtractedEditorAtWorkbenchEdge,
  findEditorNode,
  type EditorLayoutNode,
  isCollapsedEditor,
  collapseEdgeForSplitChild,
  setTabsActiveIndex,
  WORKBENCH_EDGE_DOCK_RATIO,
} from './utils';
/**
 * Configuration props for the TRN Workbench.
 */
export interface TRNWorkbenchProps {
  /** The current recursive layout tree structure. */
  layout: LayoutNode;
  /** A dictionary mapping editor types to their icons, labels, and components. */
  registry: WorkbenchRegistry;
  /** Callback triggered whenever the layout is modified (split, resized, or closed). */
  onLayoutChange: (newLayout: LayoutNode) => void;
  /** Pane id last focused (header click) — highlights collapsed rail tabs. */
  activePaneId?: string | null;
  /** Collapsed rail keyboard focus (Ctrl+Shift+[ / ]). */
  collapsedRailFocusId?: string | null;
  onPaneActivate?: (paneId: string) => void;
  onClosePane?: (paneId: string) => void;
  onTogglePaneMaximize?: (paneId: string) => void;
  paneMaximized?: boolean;
  /** Restore last split ratio for editor-type pairs (Phase C3). */
  resolveDockSplitRatio?: (
    incomingType: string,
    targetType: string,
    zone: PaneDockZone,
  ) => number;
  resolveEdgeDockRatio?: (
    incomingType: string,
    zone: Exclude<PaneDockZone, 'center'>,
  ) => number;
  onDockSplitApplied?: (
    incomingType: string,
    targetType: string,
    zone: PaneDockZone,
    ratio: number,
  ) => void;
  onEdgeDockApplied?: (
    incomingType: string,
    zone: Exclude<PaneDockZone, 'center'>,
    ratio: number,
  ) => void;
  onSplitResized?: (
    firstType: string,
    secondType: string,
    direction: 'horizontal' | 'vertical',
    ratio: number,
  ) => void;
  /** Phase C1 — detach when dragging outside workbench bounds. */
  canDetachPane?: (paneId: string) => boolean;
  onDetachToFloat?: (paneId: string, clientX: number, clientY: number) => void;
  getFloatingEditor?: (paneId: string) => EditorLayoutNode | null;
  onFloatingPaneDocked?: (paneId: string, layout: LayoutNode) => void;
}

export type TRNWorkbenchHandle = {
  startDockDrag: (
    sourcePaneId: string,
    editorType: string,
    options?: { fromFloat?: boolean },
  ) => void;
};

/**
 * TRN Workbench: A high-performance, tiling window manager for studio-grade applications.
 * Supports recursive splitting, area merging, and interactive resizing out of the box.
 */
export const TRNWorkbench = memo(
  forwardRef<TRNWorkbenchHandle, TRNWorkbenchProps>(function TRNWorkbench(
    {
      layout,
      registry,
      onLayoutChange,
      activePaneId = null,
      collapsedRailFocusId = null,
      onPaneActivate,
      onClosePane,
      onTogglePaneMaximize,
      paneMaximized = false,
      resolveDockSplitRatio,
      resolveEdgeDockRatio,
      onDockSplitApplied,
      onEdgeDockApplied,
      onSplitResized,
      canDetachPane,
      onDetachToFloat,
      getFloatingEditor,
      onFloatingPaneDocked,
    },
    ref,
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dockDrag, setDockDrag] = useState<PaneDockDragState | null>(null);
  const [dockHover, setDockHover] = useState<PaneDockHoverState | null>(null);
  const [detachFloatHover, setDetachFloatHover] = useState(false);
  const [dragPointer, setDragPointer] = useState({ x: 0, y: 0 });

  const handleDockZoneChange = useCallback(
    (targetPaneId: string, zone: PaneDockZone | null) => {
      if (!dockDrag || dockDrag.sourcePaneId === targetPaneId) {
        setDockHover(null);
        return;
      }
      if (zone == null) {
        setDockHover((prev) =>
          prev?.kind === 'pane' && prev.targetPaneId === targetPaneId ? null : prev,
        );
        return;
      }
      setDockHover({ kind: 'pane', targetPaneId, zone });
    },
    [dockDrag],
  );

  const startDockDrag = useCallback(
    (
      sourcePaneId: string,
      editorType?: string,
      options?: { fromFloat?: boolean },
    ) => {
      const fromFloat = options?.fromFloat ?? false;
      const resolvedType =
        editorType ??
        findEditorNode(layout, sourcePaneId)?.editorType ??
        getFloatingEditor?.(sourcePaneId)?.editorType;
      if (!resolvedType) return;
      setDockDrag({ sourcePaneId, editorType: resolvedType, fromFloat });
      setDockHover(null);
      setDetachFloatHover(false);
      onPaneActivate?.(sourcePaneId);
    },
    [layout, onPaneActivate, getFloatingEditor],
  );

  useImperativeHandle(ref, () => ({ startDockDrag }), [startDockDrag]);

  useEffect(() => {
    if (!dockDrag) return;

    const onMove = (e: PointerEvent) => {
      setDragPointer({ x: e.clientX, y: e.clientY });
      const el = containerRef.current;
      if (!el) return;

      const outside = isPointerOutsideElement(el, e.clientX, e.clientY);
      if (outside && !dockDrag?.fromFloat && onDetachToFloat) {
        setDetachFloatHover(true);
        setDockHover(null);
        return;
      }
      setDetachFloatHover(false);

      const globalZone = workbenchGlobalZoneAtPoint(el, e.clientX, e.clientY);
      if (globalZone) {
        setDockHover({ kind: 'global', zone: globalZone });
      } else {
        setDockHover((prev) => (prev?.kind === 'global' ? null : prev));
      }
    };

    const onEnd = () => {
      if (dockDrag) {
        if (
          detachFloatHover &&
          !dockHover &&
          !dockDrag.fromFloat &&
          onDetachToFloat &&
          (canDetachPane?.(dockDrag.sourcePaneId) ?? true)
        ) {
          onDetachToFloat(dockDrag.sourcePaneId, dragPointer.x, dragPointer.y);
        } else if (dockHover) {
          let next: LayoutNode | null = null;
          const floatingEditor = dockDrag.fromFloat
            ? getFloatingEditor?.(dockDrag.sourcePaneId)
            : null;

          if (dockHover.kind === 'global') {
            const zone = dockHover.zone;
            const ratio =
              resolveEdgeDockRatio?.(dockDrag.editorType, zone) ??
              WORKBENCH_EDGE_DOCK_RATIO[zone];
            next = floatingEditor
              ? dockExtractedEditorAtWorkbenchEdge(layout, floatingEditor, zone, ratio)
              : dockEditorPaneAtWorkbenchEdge(
                  layout,
                  dockDrag.sourcePaneId,
                  zone,
                  ratio,
                );
            if (next) onEdgeDockApplied?.(dockDrag.editorType, zone, ratio);
          } else {
            const target = findEditorNode(layout, dockHover.targetPaneId);
            const zone = dockHover.zone;
            const ratio =
              target && zone !== 'center'
                ? (resolveDockSplitRatio?.(
                    dockDrag.editorType,
                    target.editorType,
                    zone,
                  ) ?? 0.55)
                : 0.55;
            next = floatingEditor
              ? dockExtractedEditorPane(
                  layout,
                  floatingEditor,
                  dockHover.targetPaneId,
                  zone,
                  ratio,
                )
              : dockEditorPane(
                  layout,
                  dockDrag.sourcePaneId,
                  dockHover.targetPaneId,
                  zone,
                  ratio,
                );
            if (next && target && zone !== 'center') {
              onDockSplitApplied?.(dockDrag.editorType, target.editorType, zone, ratio);
            }
          }

          if (next) {
            if (floatingEditor) {
              onFloatingPaneDocked?.(dockDrag.sourcePaneId, next);
            } else {
              onLayoutChange(next);
            }
            onPaneActivate?.(dockDrag.sourcePaneId);
          }
        }
      }
      setDockDrag(null);
      setDockHover(null);
      setDetachFloatHover(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [
    dockDrag,
    dockHover,
    layout,
    onLayoutChange,
    onPaneActivate,
    resolveDockSplitRatio,
    resolveEdgeDockRatio,
    onDockSplitApplied,
    onEdgeDockApplied,
    detachFloatHover,
    canDetachPane,
    onDetachToFloat,
    getFloatingEditor,
    onFloatingPaneDocked,
  ]);

  const handleExpand = useCallback(
    (paneId: string) => {
      onLayoutChange(expandEditorPane(layout, paneId));
    },
    [layout, onLayoutChange],
  );

  const handleReorder = useCallback(
    (splitId: string, orderedPaneIds: string[]) => {
      onLayoutChange(reorderCollapsedInSplit(layout, splitId, orderedPaneIds));
    },
    [layout, onLayoutChange],
  );

  const renderNode = useCallback((node: LayoutNode): ReactNode => {
    if (node.type === 'editor') {
      if (node.collapsed) {
        const edge = node.collapseEdge ?? 'right';
        return (
          <CollapsedPaneRail
            key={node.id}
            panes={[{ id: node.id, editorType: node.editorType, collapseEdge: edge }]}
            registry={registry}
            onExpand={handleExpand}
            onClosePane={(paneId) =>
              onClosePane
                ? onClosePane(paneId)
                : onLayoutChange(closeNode(layout, paneId))
            }
            onBeginDockDrag={startDockDrag}
            focusedPaneId={collapsedRailFocusId ?? activePaneId}
          />
        );
      }

      const hoverZone =
        dockHover?.kind === 'pane' && dockHover.targetPaneId === node.id
          ? dockHover.zone
          : null;

      return (
        <PaneFrame
          key={node.id}
          node={node}
          registry={registry}
          isActive={activePaneId === node.id}
          paneMaximized={paneMaximized}
          onSplit={(dir) => onLayoutChange(splitNode(layout, node.id, dir))}
          onClose={() =>
            onClosePane ?
              onClosePane(node.id)
            : onLayoutChange(closeNode(layout, node.id))
          }
          onCollapse={() => onLayoutChange(collapseEditorPane(layout, node.id))}
          onChangeType={(type) => onLayoutChange(changeNodeType(layout, node.id, type))}
          onActivate={() => onPaneActivate?.(node.id)}
          onToggleMaximize={
            onTogglePaneMaximize != null ? () => onTogglePaneMaximize(node.id) : undefined
          }
          dockDragSourceId={dockDrag?.sourcePaneId ?? null}
          dockHoverZone={hoverZone}
          onDockZoneChange={handleDockZoneChange}
          onDockDragStart={startDockDrag}
        />
      );
    }

    if (node.type === 'tabs') {
      const activeIdx = Math.max(
        0,
        Math.min(node.activeIndex, Math.max(0, node.panes.length - 1)),
      );
      const activePane = node.panes[activeIdx];
      const hoverTargetId = activePane?.id ?? null;
      const hoverZone =
        hoverTargetId &&
        dockHover?.kind === 'pane' &&
        dockHover.targetPaneId === hoverTargetId
          ? dockHover.zone
          : null;

      return (
        <PaneTabGroup
          key={node.id}
          node={node}
          registry={registry}
          activePaneId={activePaneId}
          paneMaximized={paneMaximized}
          onSelectTab={(index) =>
            onLayoutChange(setTabsActiveIndex(layout, node.id, index))
          }
          onSplit={(paneId, dir) =>
            onLayoutChange(splitNode(layout, paneId, dir))
          }
          onClose={(paneId) =>
            onClosePane
              ? onClosePane(paneId)
              : onLayoutChange(closeNode(layout, paneId))
          }
          onCollapse={(paneId) =>
            onLayoutChange(collapseEditorPane(layout, paneId))
          }
          onChangeType={(paneId, type) =>
            onLayoutChange(changeNodeType(layout, paneId, type))
          }
          onActivate={(paneId) => onPaneActivate?.(paneId)}
          onToggleMaximize={
            onTogglePaneMaximize != null && activePane != null
              ? () => onTogglePaneMaximize(activePane.id)
              : undefined
          }
          dockDragSourceId={dockDrag?.sourcePaneId ?? null}
          dockHoverZone={hoverZone}
          dockHoverTargetPaneId={hoverTargetId}
          onDockZoneChange={handleDockZoneChange}
          onDockDragStart={startDockDrag}
        />
      );
    }

    if (isCollapsedEditor(node.first) && isCollapsedEditor(node.second)) {
      const edge =
        node.first.collapseEdge ??
        collapseEdgeForSplitChild(node.direction, 'first');
      return (
        <CollapsedPaneRail
          key={node.id}
          stackSplitId={node.id}
          panes={[
            {
              id: node.first.id,
              editorType: node.first.editorType,
              collapseEdge: edge,
            },
            {
              id: node.second.id,
              editorType: node.second.editorType,
              collapseEdge: edge,
            },
          ]}
          registry={registry}
          onExpand={handleExpand}
          onClosePane={(paneId) =>
            onClosePane
              ? onClosePane(paneId)
              : onLayoutChange(closeNode(layout, paneId))
          }
          onBeginDockDrag={startDockDrag}
          onReorder={handleReorder}
          focusedPaneId={collapsedRailFocusId ?? activePaneId}
        />
      );
    }

    return (
      <WorkbenchSplitHost
        key={node.id}
        node={node}
        layout={layout}
        onLayoutChange={onLayoutChange}
        onSplitResized={onSplitResized}
        first={renderNode(node.first)}
        second={renderNode(node.second)}
      />
    );
  }, [
    layout,
    registry,
    onLayoutChange,
    handleExpand,
    handleReorder,
    activePaneId,
    collapsedRailFocusId,
    onPaneActivate,
    onClosePane,
    onTogglePaneMaximize,
    paneMaximized,
    startDockDrag,
    dockDrag,
    dockHover,
    handleDockZoneChange,
    startDockDrag,
    onSplitResized,
  ]);

  const dragGhost = dockDrag ? registryLabel(registry, dockDrag.editorType) : null;
  const globalDockZone =
    dockHover?.kind === 'global' ? dockHover.zone : null;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden bg-bg-main text-white font-sans selection:bg-blue-500/30"
    >
      {renderNode(layout)}
      <WorkbenchFloatDetachHint visible={detachFloatHover} />
      {dockDrag ? (
        <WorkbenchGlobalDockOverlay
          visible
          activeZone={globalDockZone}
        />
      ) : null}
      {dockDrag && dragGhost ? (
        <WorkbenchDockDragLayer
          label={dragGhost.label}
          icon={dragGhost.icon}
          x={dragPointer.x}
          y={dragPointer.y}
        />
      ) : null}
    </div>
  );
  }),
);

TRNWorkbench.displayName = 'TRNWorkbench';
