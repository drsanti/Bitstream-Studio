/** Cap backing-store scale to avoid huge canvases at extreme zoom × DPR. */
export const STUDIO_CANVAS_MAX_SCALE = 4;

/**
 * Backing-store multiplier for Canvas 2D inside Sensor Studio.
 *
 * Flow nodes live under the React Flow viewport transform, so their CSS size
 * on screen is `layoutSize × viewportZoom`. Without scaling the bitmap by zoom,
 * the browser upscales a low-res buffer and gauges look soft.
 *
 * @param displayScale React Flow viewport zoom on the canvas; use 1 in the inspector.
 */
export function resolveStudioCanvasDpr(displayScale = 1): number {
  if (typeof window === "undefined") {
    return 1;
  }
  const sys = window.devicePixelRatio || 1;
  const scale =
    Number.isFinite(displayScale) && displayScale > 0 ? displayScale : 1;
  return Math.min(STUDIO_CANVAS_MAX_SCALE, sys * scale);
}

/** WebGL `setPixelRatio` helper — same zoom × DPR logic as Canvas 2D panels. */
export function resolveStudioWebGlPixelRatio(
  rendererCfg: { dprMin: number; dprMax: number },
  displayScale = 1,
): number {
  const lo = Math.min(rendererCfg.dprMin, rendererCfg.dprMax);
  return Math.max(lo, resolveStudioCanvasDpr(displayScale));
}

/** Size the backing store and reset the 2D context for CSS-pixel coordinates. */
export function prepareHiDpiCanvas2d(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  wCss: number,
  hCss: number,
  dpr: number,
): void {
  const bw = Math.max(1, Math.round(wCss * dpr));
  const bh = Math.max(1, Math.round(hCss * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  canvas.style.removeProperty("width");
  canvas.style.removeProperty("height");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
