import { useStore } from "@xyflow/react";
import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  computeResizedWindowRect,
  type TRNWindowRect,
  type TRNWindowResizeEdge,
} from "../../../../../ui/TRN/TRNWindow";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { StudioNode } from "../../store/flow-editor.store";

/** Match {@link TRNWindow} `resizeEdges="all"` — no pure north edge strip. */
const EDGE_HIT_PX = 5;
const CORNER_HIT_PX = 12;

const NO_VIEWPORT_CLAMP = 1_000_000;

export type FlowNodeEdgeResizeProps = {
  nodeId: string;
  /** Selected node with `ui.resizable === true`. */
  active: boolean;
  minWidth: number;
  minHeight: number;
  shellRef: RefObject<HTMLElement | null>;
};

function readNodeLayoutRect(node: StudioNode, shellEl: HTMLElement | null): TRNWindowRect {
  const widthRaw =
    typeof node.width === "number" && node.width > 0
      ? node.width
      : typeof node.measured?.width === "number" && node.measured.width > 0
        ? node.measured.width
        : shellEl?.offsetWidth ?? 170;
  const heightRaw =
    typeof node.height === "number" && node.height > 0
      ? node.height
      : typeof node.measured?.height === "number" && node.measured.height > 0
        ? node.measured.height
        : shellEl?.offsetHeight ?? 64;
  return {
    x: node.position.x,
    y: node.position.y,
    width: Math.max(1, Math.round(widthRaw)),
    height: Math.max(1, Math.round(heightRaw)),
  };
}

function FlowNodeResizeHandle(props: {
  edge: TRNWindowResizeEdge;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel: string;
  onResizeStart: (
    edge: TRNWindowResizeEdge,
    evt: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}) {
  const { edge, className, style, ariaLabel, onResizeStart } = props;
  return (
    <div
      className={`nodrag nopan nowheel absolute z-30 ${className ?? ""}`}
      style={style}
      onPointerDown={(evt) => onResizeStart(edge, evt)}
      aria-label={ariaLabel}
      title="Resize node"
    />
  );
}

export function FlowNodeEdgeResize(props: FlowNodeEdgeResizeProps) {
  const { nodeId, active, minWidth, minHeight, shellRef } = props;
  const onNodesChange = useFlowEditorStore((s) => s.onNodesChange);
  const zoom = useStore((s) => s.transform[2]);
  const dragBaseRef = useRef<{
    edge: TRNWindowResizeEdge;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    base: TRNWindowRect;
  } | null>(null);

  const applyLayoutRect = useCallback(
    (rect: TRNWindowRect) => {
      onNodesChange([
        {
          id: nodeId,
          type: "position",
          position: { x: rect.x, y: rect.y },
        },
        {
          id: nodeId,
          type: "dimensions",
          dimensions: { width: rect.width, height: rect.height },
          setAttributes: true,
        },
      ]);
    },
    [nodeId, onNodesChange],
  );

  const onResizeStart = useCallback(
    (edge: TRNWindowResizeEdge, evt: ReactPointerEvent<HTMLDivElement>) => {
      evt.stopPropagation();
      evt.preventDefault();
      const node = useFlowEditorStore.getState().nodes.find((n) => n.id === nodeId);
      if (node == null) {
        return;
      }
      const base = readNodeLayoutRect(node, shellRef.current);
      dragBaseRef.current = {
        edge,
        pointerId: evt.pointerId,
        startClientX: evt.clientX,
        startClientY: evt.clientY,
        base,
      };
      evt.currentTarget.setPointerCapture(evt.pointerId);

      const onPointerMove = (moveEvt: PointerEvent) => {
        const drag = dragBaseRef.current;
        if (drag == null || moveEvt.pointerId !== drag.pointerId) {
          return;
        }
        const scale = zoom > 0 ? zoom : 1;
        const dx = (moveEvt.clientX - drag.startClientX) / scale;
        const dy = (moveEvt.clientY - drag.startClientY) / scale;
        const next = computeResizedWindowRect(
          drag.edge,
          drag.base,
          dx,
          dy,
          NO_VIEWPORT_CLAMP,
          NO_VIEWPORT_CLAMP,
          minWidth,
          minHeight,
        );
        applyLayoutRect(next);
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        const drag = dragBaseRef.current;
        if (drag == null || upEvt.pointerId !== drag.pointerId) {
          return;
        }
        dragBaseRef.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    },
    [applyLayoutRect, minHeight, minWidth, nodeId, shellRef, zoom],
  );

  if (!active) {
    return null;
  }

  const edgeHit = `${EDGE_HIT_PX}px`;
  const cornerHit = `${CORNER_HIT_PX}px`;
  const edgeInset = CORNER_HIT_PX;

  return (
    <>
      <FlowNodeResizeHandle
        edge="w"
        className="cursor-w-resize"
        style={{ top: edgeInset, bottom: edgeInset, left: 0, width: edgeHit }}
        ariaLabel="Resize node from left edge"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="e"
        className="cursor-e-resize"
        style={{ top: edgeInset, bottom: edgeInset, right: 0, width: edgeHit }}
        ariaLabel="Resize node from right edge"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="s"
        className="cursor-s-resize"
        style={{ left: edgeInset, right: edgeInset, bottom: 0, height: edgeHit }}
        ariaLabel="Resize node from bottom edge"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="nw"
        className="cursor-nw-resize"
        style={{ left: 0, top: 0, width: cornerHit, height: cornerHit }}
        ariaLabel="Resize node from top-left corner"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="ne"
        className="cursor-ne-resize"
        style={{ right: 0, top: 0, width: cornerHit, height: cornerHit }}
        ariaLabel="Resize node from top-right corner"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="sw"
        className="cursor-sw-resize"
        style={{ left: 0, bottom: 0, width: cornerHit, height: cornerHit }}
        ariaLabel="Resize node from bottom-left corner"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="se"
        className="cursor-se-resize"
        style={{ right: 0, bottom: 0, width: cornerHit, height: cornerHit }}
        ariaLabel="Resize node from bottom-right corner"
        onResizeStart={onResizeStart}
      />
    </>
  );
}
