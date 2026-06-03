/*******************************************************************************
 * File Name        : wifi-panel-layout.ts
 *
 * Description      : Layout classes for Device Wi‑Fi tab panels (wrap content + scroll cap).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.1
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/**
 * Tab panel hugs its content (no min-height). Tall tabs scroll inside this cap so the shell
 * can still grow with `TRNWindow` `heightMode="auto"` up to the viewport limit.
 */
export const WIFI_TAB_CONTENT_CLASS =
  "max-h-[min(26rem,calc(88vh-10rem))] shrink-0 overflow-x-hidden overflow-y-auto scrollbar-hide px-0.5 pb-1 pt-2";
