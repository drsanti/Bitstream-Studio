/*******************************************************************************
 * File Name : bitstreamLandingBackgroundMode.store.ts
 *
 * Description : Landing backdrop mode — 2D canvas, 3D cube floor, or blended.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";

export type LandingBackgroundMode = "2d" | "3d" | "blend";

/** Nebula / flow sub-layers (Shift+double-click on landing). */
export type Landing2dOverlayPreset = "both" | "nebula" | "flow" | "none";

const STORAGE_KEY = "bitstream-studio.landing.background-mode.v1";
const OVERLAY_STORAGE_KEY = "bitstream-studio.landing.background-overlay.v1";

const MODE_CYCLE: readonly LandingBackgroundMode[] = ["2d", "3d", "blend"];

const OVERLAY_CYCLE: readonly Landing2dOverlayPreset[] = [
  "both",
  "nebula",
  "flow",
  "none",
];

export const LANDING_BACKGROUND_MODE_LABELS: Record<LandingBackgroundMode, string> = {
  "2d": "2D only",
  "3d": "3D only",
  blend: "2D + 3D blend",
};

export const LANDING_OVERLAY_LABELS: Record<Landing2dOverlayPreset, string> = {
  both: "Nebula + flow",
  nebula: "Nebula only",
  flow: "Flow only",
  none: "No overlay",
};

function isLanding2dOverlayPreset(value: string | null): value is Landing2dOverlayPreset
{
  return value === "both" || value === "nebula" || value === "flow" || value === "none";
}

function readStoredOverlay(): Landing2dOverlayPreset
{
  if (typeof window === "undefined")
  {
    return "both";
  }
  try
  {
    const stored = sessionStorage.getItem(OVERLAY_STORAGE_KEY);
    return isLanding2dOverlayPreset(stored) ? stored : "both";
  }
  catch
  {
    return "both";
  }
}

function persistOverlay(preset: Landing2dOverlayPreset): void
{
  if (typeof window === "undefined")
  {
    return;
  }
  try
  {
    sessionStorage.setItem(OVERLAY_STORAGE_KEY, preset);
  }
  catch
  {
    // ignore
  }
}

function isLandingBackgroundMode(value: string | null): value is LandingBackgroundMode
{
  return value === "2d" || value === "3d" || value === "blend";
}

function readStoredMode(): LandingBackgroundMode
{
  if (typeof window === "undefined")
  {
    return "blend";
  }
  try
  {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isLandingBackgroundMode(stored) ? stored : "blend";
  }
  catch
  {
    return "blend";
  }
}

function persistMode(mode: LandingBackgroundMode): void
{
  if (typeof window === "undefined")
  {
    return;
  }
  try
  {
    sessionStorage.setItem(STORAGE_KEY, mode);
  }
  catch
  {
    // ignore
  }
}

export type BitstreamLandingBackgroundModeStoreState = {
  mode: LandingBackgroundMode;
  overlay: Landing2dOverlayPreset;
  setMode: (mode: LandingBackgroundMode) => void;
  cycleMode: () => LandingBackgroundMode;
  setOverlay: (overlay: Landing2dOverlayPreset) => void;
  cycleOverlay: () => Landing2dOverlayPreset;
};

export const useBitstreamLandingBackgroundModeStore =
  create<BitstreamLandingBackgroundModeStoreState>((set, get) => ({
    mode: readStoredMode(),
    overlay: readStoredOverlay(),

    setMode: (mode) =>
    {
      persistMode(mode);
      set({ mode });
    },

    cycleMode: () =>
    {
      const current = get().mode;
      const index = MODE_CYCLE.indexOf(current);
      const next = MODE_CYCLE[(index + 1) % MODE_CYCLE.length] ?? "2d";
      persistMode(next);
      set({ mode: next });
      return next;
    },

    setOverlay: (overlay) =>
    {
      persistOverlay(overlay);
      set({ overlay });
    },

    cycleOverlay: () =>
    {
      const current = get().overlay;
      const index = OVERLAY_CYCLE.indexOf(current);
      const next = OVERLAY_CYCLE[(index + 1) % OVERLAY_CYCLE.length] ?? "both";
      persistOverlay(next);
      set({ overlay: next });
      return next;
    },
  }));

/** Whether the animated 2D nebula / flow layers should render. */
export function landingModeShows2d(mode: LandingBackgroundMode): boolean
{
  return mode === "2d" || mode === "blend";
}

/** Whether the WebGL cube floor should mount. */
export function landingModeShows3d(mode: LandingBackgroundMode): boolean
{
  return mode === "3d" || mode === "blend";
}

export function landingOverlayShowsNebula(overlay: Landing2dOverlayPreset): boolean
{
  return overlay === "both" || overlay === "nebula";
}

export function landingOverlayShowsFlow(overlay: Landing2dOverlayPreset): boolean
{
  return overlay === "both" || overlay === "flow";
}
