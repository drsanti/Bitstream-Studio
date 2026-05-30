import { GripHorizontal, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  loadProject4HudLayoutPanels,
  persistProject4HudPanelPosition,
  type Project4HudPersistPanelId,
} from "../../lib/project4-hud-layout";

export type Project4HudPlacement =
  | { kind: "northWest"; margin: number }
  | { kind: "northEast"; margin: number }
  | { kind: "southEast"; margin: number }
  | { kind: "southWest"; margin: number }
  | { kind: "southCenter"; marginBottom: number }
  | { kind: "manual"; x: number; y: number };

function clampToContainer(
  x: number,
  y: number,
  panelW: number,
  panelH: number,
  cw: number,
  ch: number,
): { x: number; y: number } {
  const maxX = Math.max(0, cw - Math.min(panelW, cw));
  const maxY = Math.max(0, ch - Math.min(panelH, ch));
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

function computePlacement(
  placement: Project4HudPlacement,
  cw: number,
  ch: number,
  pw: number,
  ph: number,
): { x: number; y: number } {
  switch (placement.kind) {
    case "northWest":
      return { x: placement.margin, y: placement.margin };
    case "northEast":
      return { x: cw - pw - placement.margin, y: placement.margin };
    case "southEast":
      return { x: cw - pw - placement.margin, y: ch - ph - placement.margin };
    case "southWest":
      return { x: placement.margin, y: ch - ph - placement.margin };
    case "southCenter":
      return { x: (cw - pw) / 2, y: ch - ph - placement.marginBottom };
    case "manual":
      return { x: placement.x, y: placement.y };
  }
}

export type Project4DraggableOverlayPanelProps = {
  containerRef: RefObject<HTMLElement | null>;
  placement: Project4HudPlacement;
  /** When set, **x/y** persist across reloads under **`ternion.project4.hudLayout.v1`**. */
  hudPersistId?: Project4HudPersistPanelId;
  title: string;
  zIndex?: number;
  children: ReactNode;
  /** Extra classes on the floating root (width overrides, etc.). */
  className?: string;
  /** Header dismiss — use **`HUD panels`** menu to show again. */
  onDismiss?: () => void;
};

/**
 * HUD tile with a drag handle (orbit controls stay usable — drag starts only on the handle).
 */
export function Project4DraggableOverlayPanel(props: Project4DraggableOverlayPanelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const placedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const [position, setPosition] = useState({ x: 0, y: 0 });

  const applyInitialPlacement = useCallback(() => {
    const container = props.containerRef.current;
    const panel = rootRef.current;
    if (!container || !panel || placedRef.current) {
      return;
    }
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw < 48 || ch < 48) {
      return;
    }
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    if (pw < 4 || ph < 4) {
      return;
    }

    const panels = props.hudPersistId ? loadProject4HudLayoutPanels() : {};
    const saved = props.hudPersistId ? panels[props.hudPersistId] : undefined;

    if (saved != null) {
      setPosition(clampToContainer(saved.x, saved.y, pw, ph, cw, ch));
    } else {
      const raw = computePlacement(props.placement, cw, ch, pw, ph);
      setPosition(clampToContainer(raw.x, raw.y, pw, ph, cw, ch));
    }
    placedRef.current = true;
  }, [props.containerRef, props.placement, props.hudPersistId]);

  useLayoutEffect(() => {
    placedRef.current = false;
  }, [props.placement, props.hudPersistId]);

  useLayoutEffect(() => {
    const container = props.containerRef.current;
    if (!container) {
      return;
    }

    const scheduleInitial = (): void => {
      requestAnimationFrame(() => requestAnimationFrame(() => applyInitialPlacement()));
    };

    scheduleInitial();

    const ro = new ResizeObserver(() => {
      const panel = rootRef.current;
      if (!container || !panel) {
        return;
      }
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const pw = panel.offsetWidth;
      const ph = panel.offsetHeight;
      if (cw < 48 || ch < 48 || pw < 4 || ph < 4) {
        return;
      }
      if (placedRef.current) {
        setPosition((prev) => clampToContainer(prev.x, prev.y, pw, ph, cw, ch));
      } else {
        scheduleInitial();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [props.containerRef, applyInitialPlacement]);

  useEffect(() => {
    const persistDragEnd = (): void => {
      if (!props.hudPersistId || props.containerRef.current == null || rootRef.current == null) {
        return;
      }
      const c = props.containerRef.current;
      const p = rootRef.current;
      const cr = c.getBoundingClientRect();
      const pr = p.getBoundingClientRect();
      const x = pr.left - cr.left;
      const y = pr.top - cr.top;
      persistProject4HudPanelPosition(props.hudPersistId, x, y);
    };

    const onMove = (e: PointerEvent): void => {
      if (!draggingRef.current || props.containerRef.current == null || rootRef.current == null) {
        return;
      }
      const cw = props.containerRef.current.clientWidth;
      const ch = props.containerRef.current.clientHeight;
      const pw = rootRef.current.offsetWidth;
      const ph = rootRef.current.offsetHeight;
      const { mx, my, px, py } = dragStartRef.current;
      const nx = px + (e.clientX - mx);
      const ny = py + (e.clientY - my);
      setPosition(clampToContainer(nx, ny, pw, ph, cw, ch));
    };

    const endDrag = (ev: PointerEvent): void => {
      const wasDragging = draggingRef.current;
      draggingRef.current = false;
      const h = handleRef.current;
      if (h != null && h.hasPointerCapture(ev.pointerId)) {
        h.releasePointerCapture(ev.pointerId);
      }
      if (wasDragging) {
        persistDragEnd();
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [props.containerRef, props.hudPersistId]);

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    dragStartRef.current = {
      mx: e.clientX,
      my: e.clientY,
      px: position.x,
      py: position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const z = props.zIndex ?? 40;

  return (
    <div
      ref={rootRef}
      style={{ left: position.x, top: position.y, zIndex: z }}
      className={`pointer-events-auto absolute ${props.className ?? "max-w-[min(100vw-16px,28rem)]"}`}
    >
      <div className="flex touch-none items-center gap-0 rounded-t-md border border-b-0 border-zinc-700/90 bg-zinc-950/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl ring-1 ring-black/45">
        <div
          ref={handleRef}
          data-drag-handle
          role="toolbar"
          aria-label={`Drag ${props.title}`}
          className="flex min-w-0 flex-1 cursor-grab items-center gap-2 px-2 py-1.5 active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
        >
          <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          <span className="select-none truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-200 drop-shadow-sm">
            {props.title}
          </span>
        </div>
        {props.onDismiss != null ? (
          <button
            type="button"
            aria-label={`Hide ${props.title}`}
            className="mr-1 shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onDismiss?.();
            }}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="rounded-b-md border-x border-b border-zinc-700/85 bg-zinc-950/93 shadow-[0_16px_52px_rgba(0,0,0,0.72)] ring-1 ring-black/50 backdrop-blur-xl backdrop-saturate-150">
        <div className="p-2.5 text-zinc-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">{props.children}</div>
      </div>
    </div>
  );
}
