import type { Edge } from "@xyflow/react";
import type { CSSProperties } from "react";
import type {
  FlowCanvasHandleBorderWidthPx,
  FlowCanvasHandleSizePx,
} from "../../../persistence/flow-canvas-preferences";

export function studioHandleBaseClass(
  sizePx: FlowCanvasHandleSizePx,
  borderWidthPx: FlowCanvasHandleBorderWidthPx,
): string {
  const sizeClass =
    sizePx === 10
      ? "!h-2.5 !w-2.5"
      : sizePx === 14
        ? "!h-3.5 !w-3.5"
        : "!h-3 !w-3";
  const borderClass = borderWidthPx === 1 ? "!border" : "!border-2";
  return (
    "!z-20 shrink-0 !bg-zinc-900 [&.react-flow__handle]:pointer-events-auto " +
    sizeClass +
    " " +
    borderClass
  );
}

/** Default canvas pref for unwired handle fade (see `handleUnwiredDimOpacity`). */
export const DEFAULT_UNWIRED_HANDLE_OPACITY = 0.38;

export function studioHandleDimStyle(
  dimmed: boolean,
  opacity = DEFAULT_UNWIRED_HANDLE_OPACITY,
): CSSProperties | undefined {
  if (!dimmed) {
    return undefined;
  }
  const clamped = Math.min(0.85, Math.max(0.15, opacity));
  return { opacity: clamped };
}

export function isFlowHandleWired(args: {
  nodeId: string;
  handleId: string | null | undefined;
  handleType: "source" | "target";
  edges: readonly Edge[];
}): boolean {
  const { nodeId, handleId, handleType, edges } = args;
  const hid = handleId ?? (handleType === "source" ? "out" : "in");
  for (const edge of edges) {
    if (handleType === "source") {
      if (edge.source === nodeId && (edge.sourceHandle ?? "out") === hid) {
        return true;
      }
    } else if (edge.target === nodeId && (edge.targetHandle ?? "in") === hid) {
      return true;
    }
  }
  return false;
}
