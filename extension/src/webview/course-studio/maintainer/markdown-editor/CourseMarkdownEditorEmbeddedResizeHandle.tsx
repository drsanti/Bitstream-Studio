import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  loadMarkdownEditorEmbeddedHeightPx,
  nextMarkdownEditorEmbeddedHeightPx,
  saveMarkdownEditorEmbeddedHeightPx,
} from "./markdownEditorEmbeddedSize";

export function CourseMarkdownEditorEmbeddedResizeHandle({
  heightPx,
  onHeightPxChange,
}: {
  heightPx: number;
  onHeightPxChange: (next: number) => void;
}) {
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = { startY: event.clientY, startHeight: heightPx };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [heightPx],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (drag == null) {
        return;
      }
      onHeightPxChange(
        nextMarkdownEditorEmbeddedHeightPx(drag.startHeight, event.clientY - drag.startY),
      );
    },
    [onHeightPxChange],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag == null) {
      return;
    }
    const next = nextMarkdownEditorEmbeddedHeightPx(
      drag.startHeight,
      event.clientY - drag.startY,
    );
    onHeightPxChange(next);
    saveMarkdownEditorEmbeddedHeightPx(next);
  }, [onHeightPxChange]);

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (dragRef.current == null) {
        return;
      }
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      onHeightPxChange(loadMarkdownEditorEmbeddedHeightPx());
    },
    [onHeightPxChange],
  );

  return (
    <button
      type="button"
      className="course-md-editor-embedded-resize-handle absolute right-0 bottom-0 z-20 flex h-4 w-4 touch-none items-end justify-end focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/80"
      aria-label="Resize markdown editor height"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <span
        className="pointer-events-none mb-0.5 mr-0.5 block h-2.5 w-2.5 border-r-2 border-b-2 border-zinc-400/70"
        aria-hidden
      />
    </button>
  );
}
