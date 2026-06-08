import { create } from "zustand";

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;

type PointerNorm = { x: number; y: number };

type PresentationPresenterState = {
  presentMode: boolean;
  zoom: number;
  panX: number;
  panY: number;
  laserEnabled: boolean;
  pointerNorm: PointerNorm | null;
  togglePresentMode: () => void;
  setPresentMode: (on: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  panBy: (dx: number, dy: number) => void;
  resetViewport: () => void;
  toggleLaser: () => void;
  setLaserEnabled: (on: boolean) => void;
  setPointerNorm: (pointer: PointerNorm | null) => void;
};

function clampZoom(z: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
}

export const usePresentationPresenterStore = create<PresentationPresenterState>((set, get) => ({
  presentMode: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  laserEnabled: false,
  pointerNorm: null,

  togglePresentMode: () => set((s) => ({ presentMode: !s.presentMode })),
  setPresentMode: (on) => set({ presentMode: on }),

  zoomIn: () => set((s) => ({ zoom: clampZoom(s.zoom + ZOOM_STEP) })),
  zoomOut: () => set((s) => ({ zoom: clampZoom(s.zoom - ZOOM_STEP) })),
  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),

  panBy: (dx, dy) => {
    if (get().zoom <= 1) {
      return;
    }
    set((s) => ({ panX: s.panX + dx, panY: s.panY + dy }));
  },

  resetViewport: () => set({ zoom: 1, panX: 0, panY: 0 }),

  toggleLaser: () => set((s) => ({ laserEnabled: !s.laserEnabled, pointerNorm: s.laserEnabled ? null : s.pointerNorm })),
  setLaserEnabled: (on) => set({ laserEnabled: on, pointerNorm: on ? get().pointerNorm : null }),
  setPointerNorm: (pointer) => set({ pointerNorm: pointer }),
}));
