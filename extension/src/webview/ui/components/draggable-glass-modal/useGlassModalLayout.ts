import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  clampPosition,
  getCenteredPosition,
  sanitize,
} from "./glass-modal-geometry";
import {
  loadPersistedGlassModalLayout,
  savePersistedGlassModalLayout,
} from "./glass-modal-persistence";
import type {
  DraggableGlassModalProps,
  Point2D,
  ResizeHandleKind,
} from "./types";

type ResizeSession = {
  panelX: number;
  panelY: number;
  width: number;
  height: number;
  pointerX: number;
  pointerY: number;
};

function cursorForHandle(kind: ResizeHandleKind): string {
  switch (kind) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    default:
      return "default";
  }
}

/** Drag, resize, portal mount, and clamped geometry for the glass modal. */
export function useGlassModalLayout(props: DraggableGlassModalProps) {
  const {
    initialWidth = 896,
    initialHeight = 620,
    minWidth: minWidthProp = 400,
    minHeight: minHeightProp = 320,
    maxWidth: maxWidthProp,
    maxHeight: maxHeightProp,
    onPositionChange,
    onSizeChange,
    panelId,
  } = props;

  // Clamped size + max bounds
  const effectiveMaxWidth = useMemo(
    () =>
      maxWidthProp ??
      (typeof window !== "undefined" ? window.innerWidth * 0.95 : 1200),
    [maxWidthProp],
  );

  const effectiveMaxHeight = useMemo(
    () =>
      maxHeightProp ??
      (typeof window !== "undefined" ? window.innerHeight * 0.9 : 800),
    [maxHeightProp],
  );

  const resolvedInitialWidth = useMemo(
    () =>
      Math.max(
        minWidthProp,
        Math.min(effectiveMaxWidth, sanitize(initialWidth, 896)),
      ),
    [initialWidth, minWidthProp, effectiveMaxWidth],
  );

  const resolvedInitialHeight = useMemo(
    () =>
      Math.max(
        minHeightProp,
        Math.min(effectiveMaxHeight, sanitize(initialHeight, 620)),
      ),
    [initialHeight, minHeightProp, effectiveMaxHeight],
  );

  const resolvedInitialPosition = useMemo(
    () =>
      clampPosition(
        getCenteredPosition(resolvedInitialWidth, resolvedInitialHeight),
      ),
    [resolvedInitialWidth, resolvedInitialHeight],
  );

  const initialLayout = useMemo(
    () =>
      loadPersistedGlassModalLayout(panelId, {
        position: resolvedInitialPosition,
        width: resolvedInitialWidth,
        height: resolvedInitialHeight,
      }, {
        minWidth: minWidthProp,
        minHeight: minHeightProp,
        maxWidth: effectiveMaxWidth,
        maxHeight: effectiveMaxHeight,
      }),
    [
      panelId,
      resolvedInitialPosition,
      resolvedInitialWidth,
      resolvedInitialHeight,
      minWidthProp,
      minHeightProp,
      effectiveMaxWidth,
      effectiveMaxHeight,
    ],
  );

  // Refs and state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const pointerOffsetRef = useRef<Point2D>({ x: 0, y: 0 });
  const lastKnownPositionRef = useRef<Point2D>(initialLayout.position);

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Point2D>(initialLayout.position);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(initialLayout.width);
  const [height, setHeight] = useState(initialLayout.height);

  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<ResizeHandleKind | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const originalUserSelectRef = useRef("");
  const originalCursorRef = useRef("");

  // Defer portal until client (avoids SSR / hydration mismatch)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Persist layout when `panelId` is set (debounced)
  useEffect(() => {
    if (!panelId || !mounted) {
      return;
    }
    const t = window.setTimeout(() => {
      savePersistedGlassModalLayout(panelId, { position, width, height });
    }, 150);
    return () => window.clearTimeout(t);
  }, [panelId, mounted, position.x, position.y, width, height]);

  // Last position for callbacks
  useEffect(() => {
    lastKnownPositionRef.current = position;
  }, [position]);

  const updatePosition = useCallback(
    (next: Point2D) => {
      const clamped = clampPosition(next);
      lastKnownPositionRef.current = clamped;
      setPosition(clamped);
      onPositionChange?.(clamped);
    },
    [onPositionChange],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest('[data-drag-handle="false"]') ||
        target.closest('[role="slider"]') ||
        target.closest('[role="button"]') ||
        target.closest("a")
      ) {
        return;
      }

      const headerElement = containerRef.current?.querySelector(
        '[data-drag-handle="true"]',
      );
      if (!headerElement?.contains(target)) {
        return;
      }

      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      pointerOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      isDraggingRef.current = true;
      setIsDragging(true);
      containerRef.current.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) {
        return;
      }
      isDraggingRef.current = false;
      setIsDragging(false);
      onPositionChange?.(lastKnownPositionRef.current);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [onPositionChange],
  );

  // Drag: window listeners (move outside panel)
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      updatePosition({
        x: event.clientX - pointerOffsetRef.current.x,
        y: event.clientY - pointerOffsetRef.current.y,
      });
      event.preventDefault();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      isDraggingRef.current = false;
      setIsDragging(false);
      onPositionChange?.(lastKnownPositionRef.current);

      if (containerRef.current?.hasPointerCapture(event.pointerId)) {
        try {
          containerRef.current.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [onPositionChange, updatePosition]);

  // Restore selection/cursor after resize
  const stopResizing = useCallback(() => {
    if (!isResizingRef.current) {
      return;
    }
    isResizingRef.current = false;
    resizeHandleRef.current = null;
    resizeSessionRef.current = null;
    document.body.style.userSelect = originalUserSelectRef.current;
    document.body.style.cursor = originalCursorRef.current;
  }, []);

  // Resize: window listeners (all edges + corners)
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current || !resizeSessionRef.current) {
        return;
      }
      const handle = resizeHandleRef.current;
      if (!handle) {
        return;
      }

      const s = resizeSessionRef.current;
      const dx = event.clientX - s.pointerX;
      const dy = event.clientY - s.pointerY;
      const rightEdge = s.panelX + s.width;
      const bottomEdge = s.panelY + s.height;

      let newW = s.width;
      let newH = s.height;
      let newX = s.panelX;
      let newY = s.panelY;

      const clampW = (w: number) =>
        Math.min(effectiveMaxWidth, Math.max(minWidthProp, w));
      const clampH = (h: number) =>
        Math.min(effectiveMaxHeight, Math.max(minHeightProp, h));

      switch (handle) {
        case "e":
          newW = clampW(s.width + dx);
          break;
        case "w": {
          newW = clampW(s.width - dx);
          newX = rightEdge - newW;
          break;
        }
        case "s":
          newH = clampH(s.height + dy);
          break;
        case "n": {
          newH = clampH(s.height - dy);
          newY = bottomEdge - newH;
          break;
        }
        case "ne":
          newW = clampW(s.width + dx);
          newH = clampH(s.height - dy);
          newX = s.panelX;
          newY = bottomEdge - newH;
          break;
        case "nw":
          newW = clampW(s.width - dx);
          newH = clampH(s.height - dy);
          newX = rightEdge - newW;
          newY = bottomEdge - newH;
          break;
        case "se":
          newW = clampW(s.width + dx);
          newH = clampH(s.height + dy);
          break;
        case "sw":
          newW = clampW(s.width - dx);
          newH = clampH(s.height + dy);
          newX = rightEdge - newW;
          newY = s.panelY;
          break;
        default:
          break;
      }

      const posClamped = clampPosition({ x: newX, y: newY });
      lastKnownPositionRef.current = posClamped;
      setPosition(posClamped);
      setWidth(newW);
      setHeight(newH);
      onPositionChange?.(posClamped);
      onSizeChange?.({ width: newW, height: newH });
      event.preventDefault();
    };

    const handlePointerUp = () => {
      if (isResizingRef.current) {
        stopResizing();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [
    effectiveMaxWidth,
    effectiveMaxHeight,
    minWidthProp,
    minHeightProp,
    onPositionChange,
    onSizeChange,
    stopResizing,
  ]);

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, kind: ResizeHandleKind) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      resizeSessionRef.current = {
        panelX: position.x,
        panelY: position.y,
        width,
        height,
        pointerX: event.clientX,
        pointerY: event.clientY,
      };
      resizeHandleRef.current = kind;
      originalUserSelectRef.current = document.body.style.userSelect;
      originalCursorRef.current = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = cursorForHandle(kind);

      isResizingRef.current = true;

      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [width, height, position.x, position.y],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      setPosition(lastKnownPositionRef.current);

      if (containerRef.current) {
        try {
          if (containerRef.current.hasPointerCapture(event.pointerId)) {
            containerRef.current.releasePointerCapture(event.pointerId);
          }
        } catch {
          // ignore
        }
      }
    },
    [],
  );

  return {
    mounted,
    containerRef,
    position,
    width,
    height,
    isDragging,
    handlePointerDown,
    endDrag,
    handleLostPointerCapture,
    handleResizePointerDown,
  };
}
