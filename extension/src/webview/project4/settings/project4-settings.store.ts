import { create } from "zustand";
import {
  PROJECT4_SETTINGS_DEFAULTS,
  PROJECT4_SETTINGS_STORAGE_KEY,
} from "./project4-settings.defaults";
import {
  mergeProject4SettingsFromUnknown,
  normalizeProject4Settings,
} from "./project4-settings.normalize";
import type {
  Project4SettingsState,
  Project4SettingsStore,
} from "./project4-settings.types";

function loadSavedProject4Settings(): Project4SettingsState {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return { ...PROJECT4_SETTINGS_DEFAULTS };
  }
  try {
    const raw = window.localStorage.getItem(PROJECT4_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...PROJECT4_SETTINGS_DEFAULTS };
    }
    const parsed: unknown = JSON.parse(raw);
    return mergeProject4SettingsFromUnknown(parsed);
  } catch {
    return { ...PROJECT4_SETTINGS_DEFAULTS };
  }
}

function persistProject4Settings(state: Project4SettingsState): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROJECT4_SETTINGS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Restricted storage — ignore.
  }
}

export const useProject4SettingsStore = create<Project4SettingsStore>((set) => ({
  ...loadSavedProject4Settings(),
  patchProject4Settings: (partial) => {
    set((prev) => {
      const next = normalizeProject4Settings({ ...prev, ...partial });
      persistProject4Settings(next);
      return next;
    });
  },
  resetProject4Settings: () => {
    const next = normalizeProject4Settings({ ...PROJECT4_SETTINGS_DEFAULTS });
    persistProject4Settings(next);
    set((state) => ({
      ...state,
      ...next,
    }));
  },
  resetProject4HardwareSetupToDefaults: () => {
    set((prev) => {
      const d = PROJECT4_SETTINGS_DEFAULTS;
      const next = normalizeProject4Settings({
        ...prev,
        trackWidthM: d.trackWidthM,
        wheelbaseM: d.wheelbaseM,
        wheelRadiusM: d.wheelRadiusM,
        scannerTelemetrySweepMinDeg: d.scannerTelemetrySweepMinDeg,
        scannerTelemetrySweepMaxDeg: d.scannerTelemetrySweepMaxDeg,
        reverseSafetyStopCmDisplay: d.reverseSafetyStopCmDisplay,
      });
      persistProject4Settings(next);
      return next;
    });
  },
  resetProject4TwinViewerSetupToDefaults: () => {
    set((prev) => {
      const d = PROJECT4_SETTINGS_DEFAULTS;
      const next = normalizeProject4Settings({
        ...prev,
        scannerFrontAzimuthMinDeg: d.scannerFrontAzimuthMinDeg,
        scannerFrontAzimuthMaxDeg: d.scannerFrontAzimuthMaxDeg,
        scannerRearAzimuthMinDeg: d.scannerRearAzimuthMinDeg,
        scannerRearAzimuthMaxDeg: d.scannerRearAzimuthMaxDeg,
      });
      persistProject4Settings(next);
      return next;
    });
  },
}));

/** Convenience alias — consumers pick fields with selectors. */
export const useProject4Settings = useProject4SettingsStore;
