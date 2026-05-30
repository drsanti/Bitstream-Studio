export type FloatingRailDockSide = "dock-right-edge" | "dock-left-edge";

export type FloatingRailViewportClamp = {
  paddingTopPx?: number;
  paddingBottomPx?: number;
};

export type FloatingRailPositionInput = {
  dockSide: FloatingRailDockSide;
  anchorRect: DOMRect;
  /** Rect of the rail stack itself (measured from ref). */
  railRect: DOMRect | null;
  /** Optional: rect of the panel content header inside the anchor (e.g. section header). */
  headerRect: DOMRect | null;
  /** Optional: rect of the TRNSidePanel header bar (outer chrome). */
  sidePanelHeaderRect: DOMRect | null;
  /** Fine-tuning seam adjustment (px). Default 4. */
  seamPx?: number;
  /** Small Y offset relative to computed header alignment (px). Default 0. */
  extraOffsetYPx?: number;
  /** Viewport clamp padding. Defaults to 8px top/bottom. */
  clamp?: FloatingRailViewportClamp;
};

export type FloatingRailPosition = {
  left: number;
  top: number;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function computeDockLeftEdgeX(args: {
  anchorRect: DOMRect;
  railRect: DOMRect | null;
  seamPx: number;
}): number {
  // Rail sits OUTSIDE the anchor on the right; its left edge visually touches the anchor's right edge.
  // We approximate “touch” by shifting by ~half of the rail width, minus seam compensation.
  const railWidth = args.railRect?.width ?? 32;
  const half = Math.round(railWidth / 2);
  return Math.round(args.anchorRect.right) + Math.max(0, half - args.seamPx);
}

function computeDockRightEdgeX(args: {
  anchorRect: DOMRect;
  railRect: DOMRect | null;
  seamPx: number;
}): number {
  // Rail sits on the LEFT of the anchor (inner edge for a right side panel).
  // Place the rail so its RIGHT edge visually touches the anchor's left edge.
  const railWidth = args.railRect?.width ?? 32;
  return Math.round(args.anchorRect.left) - Math.round(railWidth) + args.seamPx;
}

function computeAlignedTop(args: {
  anchorRect: DOMRect;
  headerRect: DOMRect | null;
  sidePanelHeaderRect: DOMRect | null;
  extraOffsetYPx: number;
}): number {
  // Prefer aligning to the *outer* TRNSidePanel header height. If unavailable, fall back to the local header.
  const baseTop = Math.round((args.headerRect ?? args.anchorRect).top);
  const outerHeaderHeight = args.sidePanelHeaderRect?.height ?? null;
  const alignByOuterHeader =
    outerHeaderHeight != null ? -Math.round(outerHeaderHeight / 2) : 0;
  return baseTop + alignByOuterHeader + args.extraOffsetYPx;
}

export function computeFloatingRailPosition(input: FloatingRailPositionInput): FloatingRailPosition {
  const seamPx = input.seamPx ?? 4;
  const extraOffsetYPx = input.extraOffsetYPx ?? 0;
  const clampTop = input.clamp?.paddingTopPx ?? 8;
  const clampBottom = input.clamp?.paddingBottomPx ?? 8;

  const left =
    input.dockSide === "dock-right-edge"
      ? computeDockRightEdgeX({
          anchorRect: input.anchorRect,
          railRect: input.railRect,
          seamPx,
        })
      : computeDockLeftEdgeX({
          anchorRect: input.anchorRect,
          railRect: input.railRect,
          seamPx,
        });

  const desiredTop = computeAlignedTop({
    anchorRect: input.anchorRect,
    headerRect: input.headerRect,
    sidePanelHeaderRect: input.sidePanelHeaderRect,
    extraOffsetYPx,
  });

  const railHeight = input.railRect?.height ?? null;
  const maxTop =
    railHeight != null
      ? Math.max(clampTop, window.innerHeight - Math.round(railHeight) - clampBottom)
      : desiredTop;

  return {
    left,
    top: clamp(desiredTop, clampTop, maxTop),
  };
}

