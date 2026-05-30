/**
 * Persists Library (node palette) UI preferences in localStorage.
 */

const STORAGE_KEY = "ternion.sensor-studio.nodePalette.density.v1";

export type NodePaletteDensity = "comfortable" | "dense";

function safeGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readStoredPaletteDensity(): NodePaletteDensity {
  const raw = safeGet();
  if (raw === "dense" || raw === "comfortable") {
    return raw;
  }
  return "dense";
}

export function writeStoredPaletteDensity(next: NodePaletteDensity): void {
  safeSet(next);
}
