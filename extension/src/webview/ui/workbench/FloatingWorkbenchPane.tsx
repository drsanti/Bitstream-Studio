import { memo, useCallback, useRef } from 'react';
import { GripVertical, Maximize2, X } from 'lucide-react';
import type { FloatingWorkbenchPane } from './floatingTypes';
import type { WorkbenchRegistry } from './types';
import { registryLabel } from './WorkbenchDockDragLayer';
import { cn } from './cn';
import {
  clampFloatSize,
  MIN_FLOAT_PANE_HEIGHT,
  MIN_FLOAT_PANE_WIDTH,
} from './workbenchFloat';
import { WorkbenchHintButton } from './WorkbenchHintButton';

export const FloatingWorkbenchPaneWindow = memo(function FloatingWorkbenchPaneWindow({
  pane,
  registry,
  isFront,
  onFocus,
  onClose,
  onMove,
  onResize,
  onDockDragStart,
}: {
  pane: FloatingWorkbenchPane;
  registry: WorkbenchRegistry;
  isFront: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDockDragStart: (paneId: string) => void;
}) {
  const { label, icon } = registryLabel(registry, pane.editorType);
  const info = registry[pane.editorType];
  const Component = info?.component;

  const moveRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);

  const startMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus();
      moveRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pane.x,
        originY: pane.y,
      };
      const onPointerMove = (ev: PointerEvent) => {
        const m = moveRef.current;
        if (!m) return;
        onMove(
          pane.id,
          m.originX + (ev.clientX - m.startX),
          m.originY + (ev.clientY - m.startY),
        );
      };
      const onPointerUp = () => {
        moveRef.current = null;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [onFocus, onMove, pane.id, pane.x, pane.y],
  );

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originW: pane.width,
        originH: pane.height,
      };
      const onPointerMove = (ev: PointerEvent) => {
        const r = resizeRef.current;
        if (!r) return;
        const { width, height } = clampFloatSize(
          r.originW + (ev.clientX - r.startX),
          r.originH + (ev.clientY - r.startY),
        );
        onResize(pane.id, width, height);
      };
      const onPointerUp = () => {
        resizeRef.current = null;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [onFocus, onResize, pane.height, pane.id, pane.width],
  );

  return (
    <div
      role="dialog"
      aria-label={`${label} floating pane`}
      className={cn(
        'fixed flex flex-col overflow-hidden rounded-lg border border-white/12 bg-bg-panel shadow-2xl shadow-black/60',
        isFront ? 'ring-1 ring-violet-500/40' : 'ring-1 ring-white/8',
      )}
      style={{
        left: pane.x,
        top: pane.y,
        width: pane.width,
        height: pane.height,
        zIndex: isFront ? 4800 : 4700,
        minWidth: MIN_FLOAT_PANE_WIDTH,
        minHeight: MIN_FLOAT_PANE_HEIGHT,
      }}
      onPointerDown={onFocus}
    >
      <div
        className="flex h-8 shrink-0 cursor-grab items-center gap-1.5 border-b border-white/8 bg-bg-header/90 px-1.5 backdrop-blur-md active:cursor-grabbing"
        onPointerDown={startMove}
      >
        <WorkbenchHintButton
          hint="Drag to dock back into workbench"
          ariaLabel="Dock pane"
          className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-tertiary hover:bg-white/10 hover:text-primary active:cursor-grabbing"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onDockDragStart(pane.id);
          }}
        >
          <GripVertical size={12} aria-hidden />
        </WorkbenchHintButton>
        <span className="shrink-0 opacity-80">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-primary">
          {label}
        </span>
        <span className="text-[9px] font-medium text-violet-300/90">Float</span>
        <WorkbenchHintButton
          hint="Focus pane"
          ariaLabel="Focus pane"
          className="flex h-6 w-6 items-center justify-center rounded text-tertiary hover:bg-white/10 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onFocus();
          }}
        >
          <Maximize2 size={12} aria-hidden />
        </WorkbenchHintButton>
        <WorkbenchHintButton
          hint="Close floating pane"
          ariaLabel="Close floating pane"
          className="flex h-6 w-6 items-center justify-center rounded text-tertiary hover:bg-red-500/15 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X size={13} aria-hidden />
        </WorkbenchHintButton>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {Component ? <Component /> : null}
      </div>

      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        onPointerDown={startResize}
        aria-label="Resize floating pane"
        role="separator"
      />
    </div>
  );
});
