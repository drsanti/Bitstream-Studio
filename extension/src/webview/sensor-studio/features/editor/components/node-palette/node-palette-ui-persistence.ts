/**
 * Persists Library (node palette) UI preferences in localStorage.
 */

import type { PaletteSensorSubgroup } from "./palette-entry-meta";
import type { SensorFamilyTreeLayout } from "./sensor-family-tree-layout";

export type { SensorFamilyTreeLayout };

const DENSITY_KEY = "ternion.sensor-studio.nodePalette.density.v1";
const COLLAPSED_KEY = "ternion.sensor-studio.nodePalette.collapsedSubgroups.v1";
const TREE_LAYOUT_KEY = "ternion.sensor-studio.nodePalette.sensorTreeLayout.v1";

export type NodePaletteDensity = "comfortable" | "dense";

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

export function readStoredPaletteDensity(): NodePaletteDensity {
  const raw = safeGet(DENSITY_KEY);
  if (raw === "dense" || raw === "comfortable") {
    return raw;
  }
  return "dense";
}

export function writeStoredPaletteDensity(next: NodePaletteDensity): void {
  safeSet(DENSITY_KEY, next);
}

const COLLAPSIBLE_SUBGROUPS = new Set<string>([
  "general",
  "bmi270",
  "dps368",
  "sht40",
  "bmm350",
  "quaternion",
]);

export function readStoredPaletteCollapsedSubgroups(): Set<PaletteSensorSubgroup> {
  const raw = safeGet(COLLAPSED_KEY);
  if (raw == null || raw.length === 0) {
    return new Set();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    const out = new Set<PaletteSensorSubgroup>();
    for (const item of parsed) {
      if (typeof item === "string" && COLLAPSIBLE_SUBGROUPS.has(item)) {
        out.add(item as PaletteSensorSubgroup);
      }
    }
    return out;
  } catch {
    return new Set();
  }
}

export function writeStoredPaletteCollapsedSubgroups(next: Set<PaletteSensorSubgroup>): void {
  safeSet(COLLAPSED_KEY, JSON.stringify([...next]));
}

export function readStoredPaletteSensorTreeLayout(): SensorFamilyTreeLayout {
  const raw = safeGet(TREE_LAYOUT_KEY);
  if (raw === "classic" || raw === "compact" || raw === "header-root") {
    return raw;
  }
  return "classic";
}

export function writeStoredPaletteSensorTreeLayout(next: SensorFamilyTreeLayout): void {
  safeSet(TREE_LAYOUT_KEY, next);
}
