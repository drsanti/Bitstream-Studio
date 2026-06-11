const PAN_DRAG_THRESHOLD_PX = 4;

export function dashboardViewportPanOffsets(args: {
  originPanX: number;
  originPanY: number;
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
}): { x: number; y: number } {
  return {
    x: args.originPanX + (args.clientX - args.startClientX),
    y: args.originPanY + (args.clientY - args.startClientY),
  };
}

export function dashboardViewportPanExceedsThreshold(args: {
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  thresholdPx?: number;
}): boolean {
  const threshold = args.thresholdPx ?? PAN_DRAG_THRESHOLD_PX;
  const dx = args.clientX - args.startClientX;
  const dy = args.clientY - args.startClientY;
  return dx * dx + dy * dy >= threshold * threshold;
}

export type StartDashboardViewportPanSessionArgs = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originPanX: number;
  originPanY: number;
  /** Middle / right mouse — pan on first move without click threshold. */
  immediate?: boolean;
  onPan: (offset: { x: number; y: number }) => void;
  onPanActive?: () => void;
  onPanEnd?: () => void;
  /** Left click on background without crossing drag threshold. */
  onClickWithoutDrag?: () => void;
};

/** Pointer-drag pan session for the dashboard edit viewport (transform-based). */
export function startDashboardViewportPanSession(
  args: StartDashboardViewportPanSessionArgs,
): void {
  const {
    pointerId,
    startClientX,
    startClientY,
    originPanX,
    originPanY,
    immediate = false,
    onPan,
    onPanActive,
    onPanEnd,
    onClickWithoutDrag,
  } = args;

  let panActive = immediate;

  const cleanup = (move: (event: PointerEvent) => void, end: (event: PointerEvent) => void) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", end);
    document.removeEventListener("pointercancel", end);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) {
      return;
    }
    if (!panActive) {
      if (
        !dashboardViewportPanExceedsThreshold({
          startClientX,
          startClientY,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      ) {
        return;
      }
      panActive = true;
      onPanActive?.();
    }
    event.preventDefault();
    onPan(
      dashboardViewportPanOffsets({
        originPanX,
        originPanY,
        startClientX,
        startClientY,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );
  };

  const onEnd = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) {
      return;
    }
    cleanup(onMove, onEnd);
    if (!panActive) {
      onClickWithoutDrag?.();
    }
    onPanEnd?.();
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
}
