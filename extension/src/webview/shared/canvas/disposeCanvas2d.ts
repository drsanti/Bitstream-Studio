/*******************************************************************************
 * File Name : disposeCanvas2d.ts
 *
 * Description : Release 2D canvas backing store and clear paint state on unmount.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/**
 * Clears the canvas, drops its bitmap, and resets inline size so GC can reclaim
 * GPU memory after animated backdrop layers unmount.
 */
export function disposeCanvas2d(canvas: HTMLCanvasElement | null): void
{
  if (canvas == null)
  {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (ctx != null)
  {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  canvas.width = 0;
  canvas.height = 0;
  canvas.style.width = "";
  canvas.style.height = "";
}
