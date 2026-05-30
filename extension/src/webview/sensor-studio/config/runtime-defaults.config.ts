import type { RuntimeDefaultsConfig } from "../core/config/config-types";

export const RUNTIME_DEFAULTS_CONFIG: RuntimeDefaultsConfig = {
  configVersion: 1,
  updatedAt: new Date(0).toISOString(),
  payload: {
    tickRateHz: 30,
    maxBufferedSamples: 512,
    defaultSmoothingAlpha: 0.2,
    defaultThresholdValue: 0.5,
    maxHistoryPoints: 240,
    nodePaletteLayout: "sectioned",
  },
};
