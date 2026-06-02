import {
  memo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { cn } from './cn';
import './workbench.css';

const SNAP_RATIOS = [0.25, 1 / 3, 0.5, 2 / 3, 0.75];
const SNAP_THRESHOLD = 0.04;

function snapRatio(raw: number): number {
  const clamped = Math.max(0.05, Math.min(0.95, raw));
  let best = clamped;
  let bestDist = SNAP_THRESHOLD;
  for (const target of SNAP_RATIOS) {
    const dist = Math.abs(clamped - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = target;
    }
  }
  return best;
}

/**
 * Internal props for the Splitter handle.
 */
interface SplitterProps {
  /** 'horizontal' or 'vertical' split. */
  direction: 'horizontal' | 'vertical';
  /** Callback with the new 0.0 - 1.0 ratio. */
  onResize: (newRatio: number) => void;
  /** Ref to the parent container for boundary calculations. */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Interactive resizing handle for the TRN Workbench.
 */
export const Splitter = memo(({ direction, onResize, containerRef }: SplitterProps) => {
  const isHorizontal = direction === 'horizontal';
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  const resizeCursor = isHorizontal ? 'col-resize' : 'row-resize';

  const onMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const offset = isHorizontal ? rect.left : rect.top;
      const size = isHorizontal ? rect.width : rect.height;
      const raw = (currentPos - offset) / size;
      const snapped = snapRatio(raw);
      setDragRatio(snapped);
      onResize(snapped);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      setDragRatio(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = resizeCursor;
  };

  const label =
    dragRatio != null ? `${Math.round(dragRatio * 100)}%` : null;
  const active = hovered || dragRatio != null;

  return (
    <div
      className={cn(
        'trn-splitter relative h-full w-full min-h-0 min-w-0',
        isHorizontal ? 'trn-splitter--horizontal cursor-col-resize' : 'trn-splitter--vertical cursor-row-resize',
      )}
      style={{ cursor: resizeCursor, touchAction: 'none' }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-label="Resize panes"
      data-splitter-active={active ? '' : undefined}
    >
      {label ? (
        <span
          className={cn(
            'pointer-events-none absolute z-[200] rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-blue-200',
            isHorizontal ? '-top-5 left-1/2 -translate-x-1/2' : '-left-10 top-1/2 -translate-y-1/2',
          )}
        >
          {label}
        </span>
      ) : null}
      <div className={cn('trn-splitter__track', active && 'trn-splitter__track--active')} />
      <div className={cn('trn-splitter__line', active && 'trn-splitter__line--active')} />
    </div>
  );
});

Splitter.displayName = 'Splitter';
