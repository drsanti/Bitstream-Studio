/*******************************************************************************
 * File Name : e84Movement.store.ts
 *
 * Description : Zustand store for E84 rotation simulation settings.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { create } from "zustand";

const STORAGE_KEY = "bitstream-studio.e84-rotation.settings.v1";

export type E84RotationSettings = {
  noiseScaleX: number;
  noiseScaleY: number;
  noiseScaleZ: number;
  noiseFreqX: number;
  noiseFreqY: number;
  noiseFreqZ: number;
  limitX: number;
  limitY: number;
  limitZ: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  publishingRateMs: number;
};

export const DEFAULT_E84_ROTATION_SETTINGS: E84RotationSettings = {
  noiseScaleX: 1,
  noiseScaleY: 1,
  noiseScaleZ: 1,
  noiseFreqX: 2,
  noiseFreqY: 2,
  noiseFreqZ: 2,
  limitX: 15,
  limitY: 15,
  limitZ: 15,
  speedX: 0.3,
  speedY: 0.5,
  speedZ: 0.7,
  publishingRateMs: 1000,
};

export type E84LiveRotationDeg = {
  x: number;
  y: number;
  z: number;
};

export type E84UiMode = "simulation" | "manual";

export type E84TransformMode = "translate" | "rotate" | "scale";

export type E84TransformSpace = "world" | "local";

type E84MovementStoreState = {
  settings: E84RotationSettings;
  uiMode: E84UiMode;
  transformMode: E84TransformMode;
  transformSpace: E84TransformSpace;
  targetReady: boolean;
  isSimulating: boolean;
  isPublishing: boolean;
  liveRotationDeg: E84LiveRotationDeg | null;
  resetTransformNonce: number;
  setUiMode: (mode: E84UiMode) => void;
  requestResetTransform: () => void;
  setTransformMode: (mode: E84TransformMode) => void;
  setTransformSpace: (space: E84TransformSpace) => void;
  setTargetReady: (ready: boolean) => void;
  setIsSimulating: (value: boolean) => void;
  setIsPublishing: (value: boolean) => void;
  setLiveRotationDeg: (value: E84LiveRotationDeg | null) => void;
  updateSetting: <K extends keyof E84RotationSettings>(
    key: K,
    value: E84RotationSettings[K],
  ) => void;
  resetSettings: () => void;
};

function loadInitialSettings(): E84RotationSettings
{
  if (typeof window === "undefined")
  {
    return { ...DEFAULT_E84_ROTATION_SETTINGS };
  }
  try
  {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null)
    {
      return { ...DEFAULT_E84_ROTATION_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<E84RotationSettings>;
    return { ...DEFAULT_E84_ROTATION_SETTINGS, ...parsed };
  }
  catch
  {
    return { ...DEFAULT_E84_ROTATION_SETTINGS };
  }
}

function persistSettings(settings: E84RotationSettings): void
{
  if (typeof window === "undefined")
  {
    return;
  }
  try
  {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
  catch
  {
    // ignore
  }
}

export const useE84MovementStore = create<E84MovementStoreState>((set, get) => ({
  settings: loadInitialSettings(),
  uiMode: "simulation",
  transformMode: "rotate",
  transformSpace: "world",
  targetReady: false,
  isSimulating: false,
  isPublishing: false,
  liveRotationDeg: null,
  resetTransformNonce: 0,

  requestResetTransform: () =>
  {
    set({ resetTransformNonce: get().resetTransformNonce + 1 });
  },

  setUiMode: (mode) =>
  {
    if (mode === "manual")
    {
      set({ uiMode: mode, isSimulating: false });
      return;
    }
    set({ uiMode: mode });
  },

  setTransformMode: (mode) => set({ transformMode: mode }),

  setTransformSpace: (space) => set({ transformSpace: space }),

  setTargetReady: (ready) => set({ targetReady: ready }),

  setIsSimulating: (value) =>
  {
    set({ isSimulating: value });
  },

  setIsPublishing: (value) =>
  {
    set({ isPublishing: value });
  },

  setLiveRotationDeg: (value) =>
  {
    set({ liveRotationDeg: value });
  },

  updateSetting: (key, value) =>
  {
    const settings = { ...get().settings, [key]: value };
    persistSettings(settings);
    set({ settings });
  },

  resetSettings: () =>
  {
    const settings = { ...DEFAULT_E84_ROTATION_SETTINGS };
    persistSettings(settings);
    set({ settings });
  },
}));
