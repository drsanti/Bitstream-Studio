export const TRN_FLOATING_MENU_VIEWPORT_PADDING_PX = 8;
export const TRN_FLOATING_MENU_GAP_PX = 4;
export const TRN_FLOATING_MENU_DEFAULT_MAX_HEIGHT_PX = 320;

export type TrnFloatingMenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function resolveTrnFloatingMenuPlacement(args: {
  triggerRect: DOMRect;
  menuHeightPx: number;
  maxHeightCapPx?: number;
}): Pick<TrnFloatingMenuBox, "top" | "maxHeight"> {
  const maxMenuHeight = Math.min(
    args.maxHeightCapPx ?? TRN_FLOATING_MENU_DEFAULT_MAX_HEIGHT_PX,
    window.innerHeight * 0.5,
  );
  const menuHeight = Math.min(maxMenuHeight, Math.max(48, args.menuHeightPx));
  const spaceBelow =
    window.innerHeight -
    TRN_FLOATING_MENU_VIEWPORT_PADDING_PX -
    (args.triggerRect.bottom + TRN_FLOATING_MENU_GAP_PX);
  const spaceAbove =
    args.triggerRect.top - TRN_FLOATING_MENU_GAP_PX - TRN_FLOATING_MENU_VIEWPORT_PADDING_PX;
  const openBelow = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;

  if (openBelow) {
    return {
      top: args.triggerRect.bottom + TRN_FLOATING_MENU_GAP_PX,
      maxHeight: Math.max(48, Math.min(menuHeight, spaceBelow)),
    };
  }

  const fitHeight = Math.max(48, Math.min(menuHeight, spaceAbove));
  let top = args.triggerRect.top - TRN_FLOATING_MENU_GAP_PX - fitHeight;
  if (top < TRN_FLOATING_MENU_VIEWPORT_PADDING_PX) {
    top = TRN_FLOATING_MENU_VIEWPORT_PADDING_PX;
  }
  const maxHeight = Math.max(
    48,
    Math.min(fitHeight, args.triggerRect.top - TRN_FLOATING_MENU_GAP_PX - top),
  );
  return { top, maxHeight };
}

export function resolveTrnFloatingMenuHorizontal(args: {
  triggerRect: DOMRect;
  panelWidthPx: number;
}): Pick<TrnFloatingMenuBox, "left" | "width"> {
  const panelWidth = Math.min(
    args.panelWidthPx,
    window.innerWidth - TRN_FLOATING_MENU_VIEWPORT_PADDING_PX * 2,
  );
  let left = args.triggerRect.left;
  left = Math.max(
    TRN_FLOATING_MENU_VIEWPORT_PADDING_PX,
    Math.min(left, window.innerWidth - panelWidth - TRN_FLOATING_MENU_VIEWPORT_PADDING_PX),
  );
  return { left, width: panelWidth };
}
