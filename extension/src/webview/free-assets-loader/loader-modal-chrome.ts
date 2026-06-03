import type { TRNWindowRect } from "../ui/TRN/TRNWindow.js";

/** Persisted geometry for {@link TRNWindow} hosting the free pack loader. */
export const FREE_ASSETS_LOADER_WINDOW_STORAGE_KEY =
  "ternion:free-assets-loader:window";

const FREE_LOADER_VIEWPORT_MARGIN = 32;
const FREE_LOADER_MIN_WIDTH = 480;
const FREE_LOADER_MIN_HEIGHT = 320;

export function computeInitialFreeAssetsLoaderRect(): Partial<TRNWindowRect> {
  if (typeof window === "undefined") {
    return { x: 64, y: 48, width: 960, height: 640 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(
    Math.max(FREE_LOADER_MIN_WIDTH, vw - FREE_LOADER_VIEWPORT_MARGIN),
    Math.max(FREE_LOADER_MIN_WIDTH, Math.round(vw * 0.88)),
  );
  const height = Math.min(
    Math.max(FREE_LOADER_MIN_HEIGHT, vh - FREE_LOADER_VIEWPORT_MARGIN),
    Math.max(FREE_LOADER_MIN_HEIGHT, Math.round(vh * 0.88)),
  );
  return {
    x: Math.max(16, Math.round((vw - width) / 2)),
    y: Math.max(16, Math.round((vh - height) / 2)),
    width,
    height,
  };
}

/** Shared shell tokens for Free Loader body chrome (tables, search). */

export const LOADER_MODAL_BACKDROP_CLASS =
  "t3d-shell-overlay fixed inset-0 z-200 flex bg-black/55 backdrop-blur-sm";

export const LOADER_MODAL_PANEL_CLASS =
  "relative flex flex-col overflow-hidden rounded-xl border border-zinc-700/80 " +
  "bg-zinc-950/92 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/8";

export const LOADER_MODAL_HEADER_CLASS =
  "shrink-0 border-b border-zinc-800/90 bg-zinc-900/50 px-4 py-3";

export const LOADER_MODAL_SECTION_CLASS = "shrink-0 border-b border-zinc-800/80 px-4 py-2.5";

export const LOADER_MODAL_TABLE_FRAME_CLASS =
  "min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-700/70 " +
  "bg-zinc-950/55 shadow-inner shadow-black/25";

export const LOADER_MODAL_SEARCH_INPUT_CLASS =
  "w-full min-w-0 rounded-md border border-zinc-700/80 bg-zinc-900/70 py-1.5 pl-8 pr-2.5 " +
  "text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 " +
  "focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/20";
