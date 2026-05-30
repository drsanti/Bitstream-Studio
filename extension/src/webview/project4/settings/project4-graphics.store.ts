import { create } from "zustand";
import {
  PROJECT4_GRAPHICS_DEFAULTS,
  PROJECT4_GRAPHICS_STORAGE_KEY,
} from "./project4-graphics.defaults";
import {
  mergeProject4GraphicsFromUnknown,
  normalizeProject4GraphicsSettings,
} from "./project4-graphics.normalize";
import type { Project4GraphicsState, Project4GraphicsStore } from "./project4-graphics.types";

function loadSavedProject4Graphics(): Project4GraphicsState {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return normalizeProject4GraphicsSettings(PROJECT4_GRAPHICS_DEFAULTS);
  }
  try {
    const raw = window.localStorage.getItem(PROJECT4_GRAPHICS_STORAGE_KEY);
    if (!raw) {
      return normalizeProject4GraphicsSettings(PROJECT4_GRAPHICS_DEFAULTS);
    }
    const parsed: unknown = JSON.parse(raw);
    return mergeProject4GraphicsFromUnknown(parsed);
  } catch {
    return normalizeProject4GraphicsSettings(PROJECT4_GRAPHICS_DEFAULTS);
  }
}

function persistProject4Graphics(state: Project4GraphicsState): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROJECT4_GRAPHICS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Restricted storage — ignore.
  }
}

export const useProject4GraphicsStore = create<Project4GraphicsStore>((set) => ({
  ...loadSavedProject4Graphics(),
  patchProject4Graphics: (partial) => {
    set((prev) => {
      const next = normalizeProject4GraphicsSettings({ ...prev, ...partial });
      persistProject4Graphics(next);
      return next;
    });
  },
  resetProject4Graphics: () => {
    const next = normalizeProject4GraphicsSettings({ ...PROJECT4_GRAPHICS_DEFAULTS });
    persistProject4Graphics(next);
    set((state) => ({
      ...state,
      ...next,
    }));
  },
}));
