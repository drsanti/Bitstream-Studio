import {
  clientRectFromPoints,
  collectDashboardMarqueeSelectionIds,
  type DashboardWidgetSelectionModifiers,
} from "./dashboard-widget-selection";

export type CollectMarqueeSelectionIdsArgs = {
  root: HTMLElement;
  marqueeRect: Pick<DOMRect, "left" | "top" | "right" | "bottom">;
  validIds: ReadonlySet<string>;
};

const MARQUEE_DRAG_THRESHOLD_PX = 4;
const MARQUEE_PREVIEW_THRESHOLD_PX = 1;

export type DashboardMarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function dashboardMarqueeRectFromClientPoints(
  startClientX: number,
  startClientY: number,
  clientX: number,
  clientY: number,
): DashboardMarqueeRect {
  const rect = clientRectFromPoints(startClientX, startClientY, clientX, clientY);
  return {
    left: rect.left,
    top: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  };
}

function exceedsMarqueeThreshold(args: {
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  thresholdPx: number;
}): boolean {
  const dx = args.clientX - args.startClientX;
  const dy = args.clientY - args.startClientY;
  const threshold = args.thresholdPx;
  return dx * dx + dy * dy >= threshold * threshold;
}

export type StartDashboardMarqueeSelectSessionArgs = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  modifiers: DashboardWidgetSelectionModifiers;
  gridElement: HTMLElement | null;
  validIds: ReadonlySet<string>;
  onPreview: (rect: DashboardMarqueeRect | null) => void;
  onCommit: (ids: string[], modifiers: DashboardWidgetSelectionModifiers) => void;
  onActive?: () => void;
  onEnd?: () => void;
  onClickWithoutDrag?: () => void;
  /** Keeps pointer events on the dashboard canvas during the drag. */
  captureElement?: HTMLElement | null;
  /** Override hit-test for non-dashboard grids (e.g. Course Widget Editor). */
  collectMarqueeIds?: (args: CollectMarqueeSelectionIdsArgs) => string[];
};

/** Pointer-drag marquee selection on the dashboard edit canvas. */
export function startDashboardMarqueeSelectSession(
  args: StartDashboardMarqueeSelectSessionArgs,
): void {
  let dragActive = false;

  const cleanup = (move: (event: PointerEvent) => void, end: (event: PointerEvent) => void) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", end);
    document.removeEventListener("pointercancel", end);
    if (args.captureElement != null) {
      try {
        if (args.captureElement.hasPointerCapture(args.pointerId)) {
          args.captureElement.releasePointerCapture(args.pointerId);
        }
      } catch {
        /* ignore */
      }
    }
  };

  if (args.captureElement != null) {
    try {
      args.captureElement.setPointerCapture(args.pointerId);
    } catch {
      /* ignore */
    }
  }

  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== args.pointerId) {
      return;
    }
    const previewMove = exceedsMarqueeThreshold({
      startClientX: args.startClientX,
      startClientY: args.startClientY,
      clientX: event.clientX,
      clientY: event.clientY,
      thresholdPx: MARQUEE_PREVIEW_THRESHOLD_PX,
    });
    if (!previewMove) {
      return;
    }
    if (!dragActive) {
      if (
        exceedsMarqueeThreshold({
          startClientX: args.startClientX,
          startClientY: args.startClientY,
          clientX: event.clientX,
          clientY: event.clientY,
          thresholdPx: MARQUEE_DRAG_THRESHOLD_PX,
        })
      ) {
        dragActive = true;
        args.onActive?.();
      }
    }
    event.preventDefault();
    args.onPreview(
      dashboardMarqueeRectFromClientPoints(
        args.startClientX,
        args.startClientY,
        event.clientX,
        event.clientY,
      ),
    );
  };

  const onEnd = (event: PointerEvent) => {
    if (event.pointerId !== args.pointerId) {
      return;
    }
    cleanup(onMove, onEnd);
    args.onPreview(null);
    if (!dragActive) {
      args.onClickWithoutDrag?.();
      args.onEnd?.();
      return;
    }
    if (args.gridElement != null) {
      const marqueeRect = clientRectFromPoints(
        args.startClientX,
        args.startClientY,
        event.clientX,
        event.clientY,
      );
      const collect =
        args.collectMarqueeIds ?? ((inner) => collectDashboardMarqueeSelectionIds(inner));
      const ids = collect({
        root: args.gridElement,
        marqueeRect,
        validIds: args.validIds,
      });
      args.onCommit(ids, args.modifiers);
    }
    args.onEnd?.();
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
}
