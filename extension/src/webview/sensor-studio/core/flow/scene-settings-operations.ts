import { readValueNormalizerInput } from "./value-normalizer-operations";

export function evaluateSceneSettingsExposure(
  wired: unknown,
  configExposure: unknown,
  fallback = 1,
): number {
  return readValueNormalizerInput(wired, configExposure, fallback);
}
