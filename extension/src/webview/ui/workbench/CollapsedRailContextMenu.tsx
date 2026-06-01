import { memo, useEffect, useRef } from 'react';
import { Maximize2, Move, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

export type CollapsedRailMenuAnchor = {
  x: number;
  y: number;
  paneId: string;
  paneLabel: string;
};

const ROW =
  'flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-white/[0.06]';

export const CollapsedRailContextMenu = memo(function CollapsedRailContextMenu({
  anchor,
  onClose,
  onExpand,
  onClosePane,
  onBeginMove,
}: {
  anchor: CollapsedRailMenuAnchor;
  onClose: () => void;
  onExpand: (paneId: string) => void;
  onClosePane: (paneId: string) => void;
  onBeginMove: (paneId: string) => void;
}) {
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!portalTarget) return null;

  const { paneId, paneLabel } = anchor;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label={`${paneLabel} collapsed pane`}
      className="pointer-events-auto fixed z-[600] min-w-[11rem] animate-in fade-in zoom-in-95 overflow-hidden rounded-md border border-white/10 bg-bg-header/95 py-1 shadow-2xl shadow-black/80 backdrop-blur-xl duration-100"
      style={{ top: anchor.y, left: anchor.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-tertiary">
        {paneLabel}
      </div>
      <button
        type="button"
        role="menuitem"
        className={ROW}
        onClick={() => {
          onExpand(paneId);
          onClose();
        }}
      >
        <Maximize2 size={12} className="shrink-0 opacity-70" />
        Expand
      </button>
      <button
        type="button"
        role="menuitem"
        className={cn(ROW, 'text-tertiary hover:text-primary')}
        onClick={() => {
          onBeginMove(paneId);
          onClose();
        }}
      >
        <Move size={12} className="shrink-0 opacity-70" />
        Move pane…
      </button>
      <div className="mx-2 my-1 border-t border-white/8" role="separator" />
      <button
        type="button"
        role="menuitem"
        className={cn(ROW, 'text-red-300/90 hover:bg-red-500/10 hover:text-red-200')}
        onClick={() => {
          onClosePane(paneId);
          onClose();
        }}
      >
        <X size={12} className="shrink-0 opacity-70" />
        Close pane
      </button>
    </div>,
    portalTarget,
  );
});
