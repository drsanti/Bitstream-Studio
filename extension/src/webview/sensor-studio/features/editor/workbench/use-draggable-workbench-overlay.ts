import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type DragSession = {
  pointerId: number;
  grabOffsetX: number;
  grabOffsetY: number;
};

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function clampOverlayPosition(
  parentSize: { width: number; height: number },
  overlaySize: { width: number; height: number },
  position: { x: number; y: number },
): { x: number; y: number } {
  const maxX = Math.max(0, parentSize.width - overlaySize.width);
  const maxY = Math.max(0, parentSize.height - overlaySize.height);
  return {
    x: clamp(position.x, 0, maxX),
    y: clamp(position.y, 0, maxY),
  };
}

export function clampWorkbenchOverlayPosition(
  shell: HTMLElement,
  position: { x: number; y: number },
): { x: number; y: number } {
  const parent = shell.offsetParent;
  if (!(parent instanceof HTMLElement)) {
    return position;
  }
  const parentRect = parent.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();
  return clampOverlayPosition(
    { width: parentRect.width, height: parentRect.height },
    { width: shellRect.width, height: shellRect.height },
    position,
  );
}

export function useDraggableWorkbenchOverlay(initialPosition: { x: number; y: number }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);

  const clampToParent = useCallback((next: { x: number; y: number }) => {
    const shell = shellRef.current;
    if (shell == null) {
      return next;
    }
    return clampWorkbenchOverlayPosition(shell, next);
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (shell == null) {
      return;
    }
    const parent = shell.offsetParent;
    if (!(parent instanceof HTMLElement)) {
      return;
    }
    const ro = new ResizeObserver(() => {
      setPosition((current) => clampToParent(current));
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [clampToParent]);

  const onDragHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }
      const shell = shellRef.current;
      if (shell == null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const shellRect = shell.getBoundingClientRect();
      dragRef.current = {
        pointerId: event.pointerId,
        grabOffsetX: event.clientX - shellRect.left,
        grabOffsetY: event.clientY - shellRect.top,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [],
  );

  const onDragHandlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const session = dragRef.current;
      const shell = shellRef.current;
      if (session == null || shell == null || event.pointerId !== session.pointerId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const parent = shell.offsetParent;
      if (!(parent instanceof HTMLElement)) {
        return;
      }
      const parentRect = parent.getBoundingClientRect();
      const next = clampToParent({
        x: event.clientX - parentRect.left - session.grabOffsetX,
        y: event.clientY - parentRect.top - session.grabOffsetY,
      });
      setPosition(next);
    },
    [clampToParent],
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragRef.current;
    if (session == null || event.pointerId !== session.pointerId) {
      return;
    }
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onDragHandlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      endDrag(event);
    },
    [endDrag],
  );

  const onDragHandlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      endDrag(event);
    },
    [endDrag],
  );

  const onDragHandleLostPointerCapture = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  return {
    shellRef,
    position,
    setPosition,
    dragging,
    onDragHandlePointerDown,
    onDragHandlePointerMove,
    onDragHandlePointerUp,
    onDragHandlePointerCancel,
    onDragHandleLostPointerCapture,
  };
}
