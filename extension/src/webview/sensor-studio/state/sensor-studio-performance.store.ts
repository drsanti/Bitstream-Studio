import { create } from "zustand";
import type { SensorStudioLivePerformanceStats } from "../core/runtime/sensor-studio-performance-telemetry";
import {
  mergeSensorStudioPerformancePreferences,
  readStoredSensorStudioPerformancePreferences,
  writeStoredSensorStudioPerformancePreferences,
  type SensorStudioPerformancePreferences,
} from "../persistence/sensor-studio-performance-preferences";

type SensorStudioPerformanceStore = {
  preferences: SensorStudioPerformancePreferences;
  liveStats: SensorStudioLivePerformanceStats | null;
  patchPreferences: (patch: Partial<SensorStudioPerformancePreferences>) => void;
  setLiveStats: (stats: SensorStudioLivePerformanceStats) => void;
};

export const useSensorStudioPerformanceStore = create<SensorStudioPerformanceStore>((set) => ({
  preferences: readStoredSensorStudioPerformancePreferences(),
  liveStats: null,
  patchPreferences: (patch) => {
    set((state) => {
      const next = mergeSensorStudioPerformancePreferences(state.preferences, patch);
      writeStoredSensorStudioPerformancePreferences(next);
      return { preferences: next };
    });
  },
  setLiveStats: (liveStats) => set({ liveStats }),
}));
