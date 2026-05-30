/*******************************************************************************
 * File Name : BitstreamLandingBackgroundModeHint.tsx
 *
 * Description : Small badge showing current landing backdrop mode (2D / 3D / blend).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import {
  LANDING_BACKGROUND_MODE_LABELS,
  LANDING_OVERLAY_LABELS,
  useBitstreamLandingBackgroundModeStore,
} from "./bitstreamLandingBackgroundMode.store.js";

/**
 * Non-interactive hint; double-click empty landing area to cycle modes.
 */
export function BitstreamLandingBackgroundModeHint()
{
  const mode = useBitstreamLandingBackgroundModeStore((s) => s.mode);
  const overlay = useBitstreamLandingBackgroundModeStore((s) => s.overlay);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-20 rounded-lg border border-zinc-700/70 bg-zinc-950/80 px-3 py-1.5 text-[10px] font-medium tracking-wide text-zinc-400 shadow-lg backdrop-blur-sm"
      aria-live="polite"
    >
      <div>
        <span className="text-zinc-500">Backdrop · </span>
        {LANDING_BACKGROUND_MODE_LABELS[mode]}
      </div>
      <div className="mt-1">
        <span className="text-zinc-500">Overlay · </span>
        {LANDING_OVERLAY_LABELS[overlay]}
      </div>
      <span className="mt-1 block text-[9px] font-normal leading-relaxed text-zinc-600">
        Double-click empty area · cycle backdrop
        <br />
        Shift+double-click · cycle overlay
      </span>
    </div>
  );
}
