import { NodeResizeControl } from "@xyflow/react";
import type { ControlPosition } from "@xyflow/react";
import { twMerge } from "tailwind-merge";

export type FlowNodeResizeControlProps = {
  visible: boolean;
  /** When true, show the corner indicator even without hover. */
  active?: boolean;
  minWidth?: number;
  minHeight?: number;
  position?: ControlPosition;
  className?: string;
};

// Larger hit target so users can hover “near” the corner like TRNWindow.
// Marker is offset inward so it remains visible (not flush to the border).
const HANDLE_CLASS =
  "pointer-events-auto nodrag group absolute bottom-1 right-1 z-30 h-8 w-8 cursor-se-resize bg-transparent focus-visible:outline-none";
const MARKER_CLASS =
  "absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-cyan-400/35 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100";
const MARKER_ACTIVE_CLASS = "opacity-100 border-cyan-400/55";

export function FlowNodeResizeControl(props: FlowNodeResizeControlProps) {
  const {
    visible,
    active = false,
    minWidth,
    minHeight,
    position = "bottom-right",
    className,
  } = props;

  if (!visible) {
    return null;
  }

  return (
    <NodeResizeControl
      position={position}
      minWidth={minWidth}
      minHeight={minHeight}
      className={twMerge(HANDLE_CLASS, className)}
      style={{
        background: "transparent",
        border: "none",
      }}
    >
      <span
        className={twMerge(MARKER_CLASS, active ? MARKER_ACTIVE_CLASS : null)}
      />
    </NodeResizeControl>
  );
}
