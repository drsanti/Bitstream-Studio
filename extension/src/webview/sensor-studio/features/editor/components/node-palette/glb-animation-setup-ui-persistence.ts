/**
 * Persists Build animation graph wizard UI preferences in localStorage.
 */

import type { GlbAnimationSetupCombinerMode } from "./glb-animation-setup-combiner";

const COMBINER_MODE_KEY = "ternion.sensor-studio.glbAnimationSetup.combinerMode.v1";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readStoredGlbAnimationSetupCombinerMode(): GlbAnimationSetupCombinerMode {
  const raw = safeGet(COMBINER_MODE_KEY);
  if (raw === "merge" || raw === "mix") {
    return raw;
  }
  return "mix";
}

export function writeStoredGlbAnimationSetupCombinerMode(
  next: GlbAnimationSetupCombinerMode,
): void {
  safeSet(COMBINER_MODE_KEY, next);
}
