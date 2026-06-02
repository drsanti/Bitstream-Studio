import { useStore, type NodeChange } from "@xyflow/react";
import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  type TRNWindowRect,
  type TRNWindowResizeEdge,
} from "../../../../../ui/TRN/TRNWindow";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { StudioNode } from "../../store/flow-editor.store";

/** Invisible edge strips for resize (no corner grip elements — operators resize from edges). */
const EDGE_HIT_PX = 5;

function resizeEdgeUsesEast(edge: TRNWindowResizeEdge): boolean {
  return edge === "e" || edge === "ne" || edge === "se";
}

function resizeEdgeUsesWest(edge: TRNWindowResizeEdge): boolean {
  return edge === "w" || edge === "nw" || edge === "sw";
}

function resizeEdgeUsesSouth(edge: TRNWindowResizeEdge): boolean {
  return edge === "s" || edge === "se" || edge === "sw";
}

function resizeEdgeUsesNorth(edge: TRNWindowResizeEdge): boolean {
  return edge === "n" || edge === "ne" || edge === "nw";
}

export type FlowNodeEdgeResizeProps = {
  nodeId: string;
  /** Selected node with `ui.resizable === true`. */
  active: boolean;
  minWidth: number;
  minHeight: number;
  shellRef: RefObject<HTMLElement | null>;
};

/** Prefer live shell size so west/north resize anchors match what the operator sees. */
export function readNodeLayoutRect(node: StudioNode, shellEl: HTMLElement | null): TRNWindowRect {
  const shellWidth =
    shellEl != null && shellEl.offsetWidth > 0 ? shellEl.offsetWidth : undefined;
  const shellHeight =
    shellEl != null && shellEl.offsetHeight > 0 ? shellEl.offsetHeight : undefined;
  const widthRaw =
    shellWidth ??
    (typeof node.width === "number" && node.width > 0 ? node.width : undefined) ??
    (typeof node.measured?.width === "number" && node.measured.width > 0
      ? node.measured.width
      : 170);
  const heightRaw =
    shellHeight ??
    (typeof node.height === "number" && node.height > 0 ? node.height : undefined) ??
    (typeof node.measured?.height === "number" && node.measured.height > 0
      ? node.measured.height
      : 64);
  return {
    x: node.position.x,
    y: node.position.y,
    width: Math.max(1, Math.round(widthRaw)),
    height: Math.max(1, Math.round(heightRaw)),
  };
}

/** Flow-canvas resize — no TRNWindow viewport clamp (flow coords may be negative). */
export function computeResizedFlowNodeRect(
  edge: TRNWindowResizeEdge,
  base: TRNWindowRect,
  dx: number,
  dy: number,
  minWidth: number,
  minHeight: number,
): TRNWindowRect {
  let x = base.x;
  let y = base.y;
  let width = base.width;
  let height = base.height;

  if (resizeEdgeUsesEast(edge)) {
    width = Math.max(minWidth, base.width + dx);
  }
  if (resizeEdgeUsesWest(edge)) {
    const nextWidth = Math.max(minWidth, base.width - dx);
    x = base.x + base.width - nextWidth;
    width = nextWidth;
  }
  if (resizeEdgeUsesSouth(edge)) {
    height = Math.max(minHeight, base.height + dy);
  }
  if (resizeEdgeUsesNorth(edge)) {
    const nextHeight = Math.max(minHeight, base.height - dy);
    y = base.y + base.height - nextHeight;
    height = nextHeight;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(Math.max(minWidth, width)),
    height: Math.round(Math.max(minHeight, height)),
  };
}

export function flowNodeDimensionChanges(
  nodeId: string,
  width: number,
  height: number,
): NodeChange[] {
  return [
    {
      id: nodeId,
      type: "dimensions",
      dimensions: { width, height },
      setAttributes: true,
    },
  ];
}

/** Shrink/grow RF node box to match measured shell after body show/hide. */
export function syncFlowNodeShellDimensions(
  nodeId: string,
  shellEl: HTMLElement,
  minWidth: number,
  minHeight: number,
  currentWidth: number | undefined,
  currentHeight: number | undefined,
  onNodesChange: (changes: NodeChange[]) => void,
): void {
  const width = Math.max(minWidth, Math.round(shellEl.offsetWidth));
  const height = Math.max(minHeight, Math.round(shellEl.offsetHeight));
  if (currentWidth === width && currentHeight === height) {
    return;
  }
  onNodesChange(flowNodeDimensionChanges(nodeId, width, height));
}

function flowNodeResizeChanges(
  nodeId: string,
  edge: TRNWindowResizeEdge,
  rect: TRNWindowRect,
): NodeChange[] {
  const changes: NodeChange[] = [
    {
      id: nodeId,
      type: "dimensions",
      dimensions: { width: rect.width, height: rect.height },
      setAttributes: true,
    },
  ];
  if (resizeEdgeUsesWest(edge) || resizeEdgeUsesNorth(edge)) {
    changes.unshift({
      id: nodeId,
      type: "position",
      position: { x: rect.x, y: rect.y },
    });
  }
  return changes;
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
    (edge: TRNWindowResizeEdge, rect: TRNWindowRect) => {
      onNodesChange(flowNodeResizeChanges(nodeId, edge, rect));
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
        const next = computeResizedFlowNodeRect(
          drag.edge,
          drag.base,
          dx,
          dy,
          minWidth,
          minHeight,
        );
        applyLayoutRect(drag.edge, next);
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

  return (
    <>
      <FlowNodeResizeHandle
        edge="w"
        className="cursor-w-resize"
        style={{ top: 0, bottom: 0, left: 0, width: edgeHit }}
        ariaLabel="Resize node from left edge"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="e"
        className="cursor-e-resize"
        style={{ top: 0, bottom: 0, right: 0, width: edgeHit }}
        ariaLabel="Resize node from right edge"
        onResizeStart={onResizeStart}
      />
      <FlowNodeResizeHandle
        edge="s"
        className="cursor-s-resize"
        style={{ left: 0, right: 0, bottom: 0, height: edgeHit }}
        ariaLabel="Resize node from bottom edge"
        onResizeStart={onResizeStart}
      />
    </>
  );
}
