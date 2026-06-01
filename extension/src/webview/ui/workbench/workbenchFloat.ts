/** Default size for a pane detached to a floating window. */
export const DEFAULT_FLOAT_PANE_WIDTH = 520;
export const DEFAULT_FLOAT_PANE_HEIGHT = 400;
export const MIN_FLOAT_PANE_WIDTH = 280;
export const MIN_FLOAT_PANE_HEIGHT = 200;
export const FLOAT_DETACH_MARGIN_PX = 16;

export function isPointerOutsideElement(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  margin = FLOAT_DETACH_MARGIN_PX,
): boolean {
  const rect = el.getBoundingClientRect();
  return (
    clientX < rect.left - margin ||
    clientX > rect.right + margin ||
    clientY < rect.top - margin ||
    clientY > rect.bottom + margin
  );
}

/** Center a float window on the pointer. */
export function floatPanePositionFromPointer(
  clientX: number,
  clientY: number,
  width = DEFAULT_FLOAT_PANE_WIDTH,
  height = DEFAULT_FLOAT_PANE_HEIGHT,
): { x: number; y: number } {
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);
  return {
    x: Math.min(maxX, Math.max(margin, clientX - width * 0.35)),
    y: Math.min(maxY, Math.max(margin, clientY - 24)),
  };
}

export function clampFloatSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(MIN_FLOAT_PANE_WIDTH, Math.min(width, window.innerWidth - 16)),
    height: Math.max(MIN_FLOAT_PANE_HEIGHT, Math.min(height, window.innerHeight - 16)),
  };
}
