import { memo, type MouseEvent as ReactMouseEvent } from "react";

interface SplitterProps {
  direction: "horizontal" | "vertical";
  onResize: (newRatio: number) => void;
}

/**
 * Resize handle sized against the immediate split parent (`parentElement`),
 * so nested splits resize correctly (unlike a single root container ref).
 */
export const Splitter = memo(({ direction, onResize }: SplitterProps) => {
  const isHorizontal = direction === "horizontal";

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const parent = e.currentTarget.parentElement;
    if (parent == null) {
      return;
    }
    const rect = parent.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const offset = isHorizontal ? rect.left : rect.top;
      const size = isHorizontal ? rect.width : rect.height;
      if (size <= 0) {
        return;
      }
      const newRatio = (currentPos - offset) / size;
      onResize(newRatio);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={`workbench-splitter ${direction}`}
      style={{
        width: isHorizontal ? "4px" : "100%",
        height: isHorizontal ? "100%" : "4px",
        background: "var(--workbench-border, rgba(255,255,255,0.1))",
        cursor: isHorizontal ? "col-resize" : "row-resize",
        zIndex: 50,
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    />
  );
});

Splitter.displayName = "Splitter";
