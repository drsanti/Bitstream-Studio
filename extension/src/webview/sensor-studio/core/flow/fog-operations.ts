import { readValueNormalizerInput } from "./value-normalizer-operations";

export const FOG_DEFAULTS = {
  near: 1,
  far: 50,
  density: 0.05,
} as const;

export function evaluateFogOutputs(
  nearWired: unknown,
  nearCfg: unknown,
  farWired: unknown,
  farCfg: unknown,
  densityWired: unknown,
  densityCfg: unknown,
): { near: number; far: number; density: number } {
  return {
    near: readValueNormalizerInput(nearWired, nearCfg, FOG_DEFAULTS.near),
    far: readValueNormalizerInput(farWired, farCfg, FOG_DEFAULTS.far),
    density: readValueNormalizerInput(densityWired, densityCfg, FOG_DEFAULTS.density),
  };
}
