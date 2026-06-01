import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FloatingWorkbenchPane } from './floatingTypes';
import type { WorkbenchRegistry } from './types';
import { FloatingWorkbenchPaneWindow } from './FloatingWorkbenchPane';

export const FloatingWorkbenchLayer = memo(function FloatingWorkbenchLayer({
  panes,
  registry,
  frontPaneId,
  onFocusPane,
  onClosePane,
  onMovePane,
  onResizePane,
  onDockDragStart,
  portalTarget: portalTargetProp,
}: {
  panes: FloatingWorkbenchPane[];
  registry: WorkbenchRegistry;
  frontPaneId: string | null;
  onFocusPane: (paneId: string) => void;
  onClosePane: (paneId: string) => void;
  onMovePane: (paneId: string, x: number, y: number) => void;
  onResizePane: (paneId: string, width: number, height: number) => void;
  onDockDragStart: (paneId: string) => void;
  /** Where float windows render. Defaults to `document.body`. */
  portalTarget?: HTMLElement | null;
}) {
  const [bodyPortal, setBodyPortal] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setBodyPortal(document.body);
  }, []);
  const portalTarget = portalTargetProp ?? bodyPortal;
  if (!portalTarget || panes.length === 0) return null;

  return createPortal(
    <>
      {panes.map((pane) => (
        <FloatingWorkbenchPaneWindow
          key={pane.id}
          pane={pane}
          registry={registry}
          isFront={frontPaneId === pane.id}
          onFocus={() => onFocusPane(pane.id)}
          onClose={() => onClosePane(pane.id)}
          onMove={onMovePane}
          onResize={onResizePane}
          onDockDragStart={onDockDragStart}
        />
      ))}
    </>,
    portalTarget,
  );
});
