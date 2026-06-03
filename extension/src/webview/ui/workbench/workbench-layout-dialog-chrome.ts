import type { TRNWindowRect } from "../TRN/TRNWindow.js";

/** Shared text field styling for workbench layout modals. */
export const WORKBENCH_LAYOUT_FIELD_INPUT_CLASS =
  "w-full min-w-0 rounded-md border border-zinc-700/80 bg-zinc-900/70 px-2.5 py-1.5 text-[13px] text-zinc-100 outline-none transition-colors " +
  "placeholder:text-zinc-500 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/20";

export function computeCenteredWorkbenchDialogRect(
  widthPx: number,
  heightPx: number,
): Partial<TRNWindowRect> {
  if (typeof window === "undefined") {
    return { x: 120, y: 80, width: widthPx, height: heightPx };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(widthPx, Math.max(320, vw - 48));
  const height = Math.min(heightPx, Math.max(240, vh - 48));
  return {
    x: Math.max(16, (vw - width) / 2),
    y: Math.max(16, (vh - height) / 2),
    width,
    height,
  };
}
