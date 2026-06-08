import { useUpdateNodeInternals } from "@xyflow/react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import {
  measureFlowNodeHeaderIntrinsicWidth,
  measureSubgraphSocketRegionContentWidth,
  resolveFlowNodeSocketRegionMinWidthPx,
} from "../nodes/flow-node/flow-node-intrinsic-size";
import {
  syncFlowNodeContentFit,
  syncFlowNodeHeightFit,
} from "../nodes/flow-node/FlowNodeEdgeResize";
import { resolveStudioFlowNodeChromeHitLayoutHeightFloor } from "../nodes/flow-node/studio-flow-node-chrome-hit";
import { useFlowEditorStore } from "../store/flow-editor.store";
import type { SubgraphFlowNodeKind } from "./subgraph-flow-node-min-dimensions";
import { resolveSubgraphFlowNodeMinDimensions } from "./subgraph-flow-node-min-dimensions";

const SHELL_CHROME_PX = 14;

function readFlowNodeLayoutSize(node: {
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
}): { width?: number; height?: number } {
  const width =
    typeof node.width === "number" && node.width > 0
      ? Math.round(node.width)
      : typeof node.measured?.width === "number" && node.measured.width > 0
        ? Math.round(node.measured.width)
        : undefined;
  const height =
    typeof node.height === "number" && node.height > 0
      ? Math.round(node.height)
      : typeof node.measured?.height === "number" && node.measured.height > 0
        ? Math.round(node.measured.height)
        : undefined;
  return { width, height };
}

function measureSubgraphSocketRegionsWidth(
  bodyEl: HTMLElement,
  socketLivePreviewsVisible: boolean,
): number {
  const socketRegions = bodyEl.querySelectorAll<HTMLElement>(
    "[data-subgraph-socket-region]",
  );
  let socketsW = 0;
  socketRegions.forEach((region) => {
    const rowContentW = measureSubgraphSocketRegionContentWidth(region);
    const liveW = socketLivePreviewsVisible
      ? resolveFlowNodeSocketRegionMinWidthPx(region)
      : 0;
    socketsW = Math.max(socketsW, rowContentW, liveW);
  });
  return socketsW;
}

/** Empty-state copy — measure off-DOM so it never reads stretched `w-full` width. */
function measureSubgraphEmptyBodyCopyWidth(bodyEl: HTMLElement): number {
  const emptyEl = bodyEl.querySelector<HTMLElement>(".studio-group-boundary__empty");
  if (emptyEl == null) {
    return 0;
  }
  const clone = emptyEl.cloneNode(true) as HTMLElement;
  clone.style.cssText =
    "position:fixed;left:-9999px;top:0;width:max-content;max-width:none;visibility:hidden;pointer-events:none;white-space:nowrap;";
  document.body.appendChild(clone);
  const w = Math.ceil(clone.scrollWidth);
  clone.remove();
  return w;
}

export type SubgraphFlowNodeShellSizeRefs = {
  shellRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
};

export function useSubgraphFlowNodeShellSize(args: {
  nodeId: string;
  kind: SubgraphFlowNodeKind;
  selected: boolean;
  /** Bumps when socket rows / labels / live previews change. */
  measureKey: string;
  /** When true (default), edge resize is available and width only auto-grows. */
  resizable?: boolean;
  /** When false, socket regions use label-only intrinsic width (no live preview column). */
  socketLivePreviewsVisible?: boolean;
}): SubgraphFlowNodeShellSizeRefs & {
  resizeActive: boolean;
  minWidth: number;
  minHeight: number;
} {
  const {
    nodeId,
    kind,
    selected,
    measureKey,
    resizable = true,
    socketLivePreviewsVisible = true,
  } = args;
  const { minWidth, minHeight } = resolveSubgraphFlowNodeMinDimensions(kind);
  const onNodesChange = useFlowEditorStore((s) => s.onNodesChange);
  const updateNodeInternals = useUpdateNodeInternals();

  const shellRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const lastMeasureKeyRef = useRef<string | null>(null);
  const lastSyncedRef = useRef<{ width: number; height: number } | null>(null);
  const socketLivePreviewsVisibleRef = useRef(socketLivePreviewsVisible);
  socketLivePreviewsVisibleRef.current = socketLivePreviewsVisible;

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    const bodyEl = bodyRef.current;
    if (headerEl == null || bodyEl == null) {
      return;
    }

    const measure = () => {
      const storeNode = useFlowEditorStore.getState().nodes.find((n) => n.id === nodeId);
      const { width: flowNodeWidth, height: flowNodeHeight } =
        storeNode != null
          ? readFlowNodeLayoutSize(storeNode)
          : { width: undefined, height: undefined };

      const headerH = headerEl.offsetHeight;
      const bodyH = bodyEl.offsetHeight;
      const fitH = resolveStudioFlowNodeChromeHitLayoutHeightFloor(
        headerH + bodyH,
      );

      const headerW = measureFlowNodeHeaderIntrinsicWidth(headerEl);
      const socketsW = measureSubgraphSocketRegionsWidth(
        bodyEl,
        socketLivePreviewsVisibleRef.current,
      );
      const emptyBodyW = measureSubgraphEmptyBodyCopyWidth(bodyEl);
      const fitW = Math.max(
        minWidth,
        Math.ceil(Math.max(headerW, socketsW, emptyBodyW) + SHELL_CHROME_PX),
      );

      const roundedCurrentW =
        flowNodeWidth != null && Number.isFinite(flowNodeWidth) && flowNodeWidth > 0
          ? Math.round(flowNodeWidth)
          : null;
      const roundedCurrentH =
        flowNodeHeight != null && Number.isFinite(flowNodeHeight) && flowNodeHeight > 0
          ? Math.round(flowNodeHeight)
          : null;

      const modeChanged = lastMeasureKeyRef.current !== measureKey;
      if (modeChanged) {
        lastMeasureKeyRef.current = measureKey;
        lastSyncedRef.current = null;
      }

      const applySync = (targetW: number, targetH: number) => {
        if (
          lastSyncedRef.current != null &&
          lastSyncedRef.current.width === targetW &&
          lastSyncedRef.current.height === targetH
        ) {
          return;
        }
        lastSyncedRef.current = { width: targetW, height: targetH };
        syncFlowNodeContentFit(
          nodeId,
          targetW,
          targetH,
          onNodesChange,
          roundedCurrentW ?? undefined,
          roundedCurrentH ?? undefined,
        );
        queueMicrotask(() => updateNodeInternals(nodeId));
      };

      const applyHeightSync = (width: number, targetH: number) => {
        if (
          lastSyncedRef.current != null &&
          lastSyncedRef.current.width === width &&
          lastSyncedRef.current.height === targetH
        ) {
          return;
        }
        lastSyncedRef.current = { width, height: targetH };
        syncFlowNodeHeightFit(
          nodeId,
          targetH,
          onNodesChange,
          width,
          roundedCurrentH ?? undefined,
        );
        if (roundedCurrentH !== targetH) {
          queueMicrotask(() => updateNodeInternals(nodeId));
        }
      };

      if (!resizable) {
        if (modeChanged || roundedCurrentW !== fitW || roundedCurrentH !== fitH) {
          applySync(fitW, fitH);
        }
        return;
      }

      const widthStripped = roundedCurrentW == null;
      const needsGrow = roundedCurrentW != null && fitW > roundedCurrentW;
      if (modeChanged || widthStripped || needsGrow) {
        if (roundedCurrentW !== fitW) {
          applySync(fitW, fitH);
        } else if (roundedCurrentH !== fitH) {
          const width =
            roundedCurrentW != null && roundedCurrentW > 0
              ? roundedCurrentW
              : fitW;
          applyHeightSync(width, fitH);
        }
        return;
      }

      if (roundedCurrentH !== fitH) {
        const width =
          roundedCurrentW != null && roundedCurrentW > 0
            ? roundedCurrentW
            : fitW;
        applyHeightSync(width, fitH);
      }
    };

    const measureAfterLayout = () => {
      measure();
      requestAnimationFrame(measure);
    };

    measureAfterLayout();
    const ro = new ResizeObserver(measureAfterLayout);
    ro.observe(headerEl);
    ro.observe(bodyEl);
    return () => ro.disconnect();
  }, [
    measureKey,
    minHeight,
    minWidth,
    nodeId,
    onNodesChange,
    resizable,
    updateNodeInternals,
  ]);

  return {
    shellRef,
    headerRef,
    bodyRef,
    resizeActive: selected && resizable,
    minWidth,
    minHeight,
  };
}
