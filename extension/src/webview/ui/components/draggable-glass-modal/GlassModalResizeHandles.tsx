import type { PointerEvent as ReactPointerEvent } from "react";
import { twMerge } from "tailwind-merge";
import type { ResizeHandleKind } from "./types";

const hitHover =
  "bg-transparent transition-colors hover:bg-zinc-600/35";

export type GlassModalResizeHandlesProps = {
  onResizePointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    kind: ResizeHandleKind,
  ) => void;
};

/** Invisible edge and corner targets for resizing (compass + diagonals). */
export function GlassModalResizeHandles({
  onResizePointerDown,
}: GlassModalResizeHandlesProps) {
  const on = (kind: ResizeHandleKind) => (e: ReactPointerEvent<HTMLDivElement>) =>
    onResizePointerDown(e, kind);

  return (
    <>
      {/* Edges (inset so corners own the corner pixels) */}
      <div
        className={twMerge(
          "absolute left-3 right-3 top-0 z-50 h-2 cursor-ns-resize",
          hitHover,
        )}
        onPointerDown={on("n")}
        data-drag-handle="false"
        aria-hidden
      />
      <div
        className={twMerge(
          "absolute bottom-0 left-3 right-3 z-50 h-2 cursor-ns-resize",
          hitHover,
        )}
        onPointerDown={on("s")}
        data-drag-handle="false"
        aria-hidden
      />
      <div
        className={twMerge(
          "absolute bottom-3 left-0 top-3 z-50 w-2 cursor-ew-resize",
          hitHover,
        )}
        onPointerDown={on("w")}
        data-drag-handle="false"
        aria-hidden
      />
      <div
        className={twMerge(
          "absolute bottom-3 right-0 top-3 z-50 w-2 cursor-ew-resize",
          hitHover,
        )}
        onPointerDown={on("e")}
        data-drag-handle="false"
        aria-hidden
      />
      {/* Corners */}
      <div
        className={twMerge(
          "absolute left-0 top-0 z-60 h-3 w-3 cursor-nwse-resize",
          hitHover,
        )}
        onPointerDown={on("nw")}
        data-drag-handle="false"
        aria-hidden
      />
      <div
        className={twMerge(
          "absolute right-0 top-0 z-60 h-3 w-3 cursor-nesw-resize",
          hitHover,
        )}
        onPointerDown={on("ne")}
        data-drag-handle="false"
        aria-hidden
      />
      <div
        className={twMerge(
          "absolute bottom-0 left-0 z-60 h-3 w-3 cursor-nesw-resize",
          hitHover,
        )}
        onPointerDown={on("sw")}
        data-drag-handle="false"
        aria-hidden
      />
      <div
        className={twMerge(
          "absolute bottom-0 right-0 z-60 h-3 w-3 cursor-nwse-resize",
          hitHover,
        )}
        onPointerDown={on("se")}
        data-drag-handle="false"
        aria-hidden
      />
    </>
  );
}
