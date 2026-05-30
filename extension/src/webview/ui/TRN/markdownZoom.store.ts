import { create } from "zustand";

const STORAGE_KEY = "trn:markdown-zoom-pct";

export type TrnMarkdownZoomState = {
  zoomPct: number;
  setZoomPct: (pct: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

function clampZoomPct(pct: number): number {
  if (!Number.isFinite(pct)) {
    return 100;
  }
  return Math.max(80, Math.min(180, Math.round(pct)));
}

function loadInitialZoomPct(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return 100;
    }
    const v = Number.parseInt(raw, 10);
    if (!Number.isFinite(v)) {
      return 100;
    }
    return clampZoomPct(v);
  } catch {
    return 100;
  }
}

function persistZoomPct(pct: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(pct));
  } catch {
    // ignore
  }
}

export const useTrnMarkdownZoomStore = create<TrnMarkdownZoomState>((set, get) => {
  const initial = typeof localStorage === "undefined" ? 100 : loadInitialZoomPct();
  const setZoomPct = (pct: number) => {
    const next = clampZoomPct(pct);
    set({ zoomPct: next });
    persistZoomPct(next);
  };
  return {
    zoomPct: initial,
    setZoomPct,
    zoomIn: () => setZoomPct(get().zoomPct + 10),
    zoomOut: () => setZoomPct(get().zoomPct - 10),
    reset: () => setZoomPct(100),
  };
});

