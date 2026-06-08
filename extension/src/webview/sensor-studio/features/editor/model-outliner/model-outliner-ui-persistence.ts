/**
 * Persists Model Outliner UI preferences in localStorage.
 */

import type { ModelOutlinerTypeFilter } from "./model-outliner-type-filter";

const SCOPE_MODE_KEY = "ternion.sensor-studio.modelOutliner.scopeMode.v1";
const TREE_MODE_KEY = "ternion.sensor-studio.modelOutliner.treeMode.v1";
const CANVAS_MODEL_ID_KEY = "ternion.sensor-studio.modelOutliner.canvasModelId.v1";
const CATALOG_ASSET_ID_KEY = "ternion.sensor-studio.modelOutliner.catalogAssetId.v1";
const TYPE_FILTER_KEY = "ternion.sensor-studio.modelOutliner.typeFilter.v1";
const FOLLOW_STAGE_PICK_KEY = "ternion.sensor-studio.modelOutliner.followStagePick.v1";
const TREE_SPLIT_RATIO_KEY = "ternion.sensor-studio.modelOutliner.treeSplitRatio.v1";
const ANIMATIONS_BLOCK_EXPANDED_KEY = "ternion.sensor-studio.modelOutliner.animationsBlockExpanded.v1";

const DEFAULT_TREE_SPLIT_RATIO = 0.64;
const MIN_TREE_SPLIT_RATIO = 0.28;
const MAX_TREE_SPLIT_RATIO = 0.78;

export type ModelOutlinerScopeMode = "canvas-model-select" | "catalog-inline";

export type ModelOutlinerTreeMode = "folders" | "hierarchy";

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

export function readStoredModelOutlinerScopeMode(): ModelOutlinerScopeMode {
  const raw = safeGet(SCOPE_MODE_KEY);
  if (raw === "canvas-model-select" || raw === "catalog-inline") {
    return raw;
  }
  return "canvas-model-select";
}

export function writeStoredModelOutlinerScopeMode(next: ModelOutlinerScopeMode): void {
  safeSet(SCOPE_MODE_KEY, next);
}

export function readStoredModelOutlinerTreeMode(): ModelOutlinerTreeMode {
  const raw = safeGet(TREE_MODE_KEY);
  if (raw === "folders" || raw === "hierarchy") {
    return raw;
  }
  return "folders";
}

export function writeStoredModelOutlinerTreeMode(next: ModelOutlinerTreeMode): void {
  safeSet(TREE_MODE_KEY, next);
}

export function readStoredModelOutlinerCanvasModelId(): string | null {
  const raw = safeGet(CANVAS_MODEL_ID_KEY);
  if (raw == null || raw.trim().length === 0) {
    return null;
  }
  return raw.trim();
}

export function writeStoredModelOutlinerCanvasModelId(next: string | null): void {
  if (next == null || next.trim().length === 0) {
    safeSet(CANVAS_MODEL_ID_KEY, "");
    return;
  }
  safeSet(CANVAS_MODEL_ID_KEY, next.trim());
}

export function readStoredModelOutlinerCatalogAssetId(): string | null {
  const raw = safeGet(CATALOG_ASSET_ID_KEY);
  if (raw == null || raw.trim().length === 0) {
    return null;
  }
  return raw.trim();
}

export function writeStoredModelOutlinerCatalogAssetId(next: string | null): void {
  if (next == null || next.trim().length === 0) {
    safeSet(CATALOG_ASSET_ID_KEY, "");
    return;
  }
  safeSet(CATALOG_ASSET_ID_KEY, next.trim());
}

const VALID_TYPE_FILTERS = new Set<ModelOutlinerTypeFilter>([
  "all",
  "animation",
  "part",
  "material",
  "morph",
  "light",
  "camera",
]);

export function readStoredModelOutlinerTypeFilter(): ModelOutlinerTypeFilter {
  const raw = safeGet(TYPE_FILTER_KEY);
  if (raw != null && VALID_TYPE_FILTERS.has(raw as ModelOutlinerTypeFilter)) {
    return raw as ModelOutlinerTypeFilter;
  }
  return "all";
}

export function writeStoredModelOutlinerTypeFilter(next: ModelOutlinerTypeFilter): void {
  safeSet(TYPE_FILTER_KEY, next);
}

export function readStoredModelOutlinerFollowStagePick(): boolean {
  const raw = safeGet(FOLLOW_STAGE_PICK_KEY);
  if (raw === "0") {
    return false;
  }
  if (raw === "1") {
    return true;
  }
  return true;
}

export function writeStoredModelOutlinerFollowStagePick(next: boolean): void {
  safeSet(FOLLOW_STAGE_PICK_KEY, next ? "1" : "0");
}

/** Top (tree) pane share of the outliner body split; remainder is Properties. */
export function readStoredModelOutlinerTreeSplitRatio(): number {
  const raw = safeGet(TREE_SPLIT_RATIO_KEY);
  if (raw == null) {
    return DEFAULT_TREE_SPLIT_RATIO;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return DEFAULT_TREE_SPLIT_RATIO;
  }
  return Math.max(MIN_TREE_SPLIT_RATIO, Math.min(MAX_TREE_SPLIT_RATIO, n));
}

export function writeStoredModelOutlinerTreeSplitRatio(next: number): void {
  if (!Number.isFinite(next)) {
    return;
  }
  const clamped = Math.max(MIN_TREE_SPLIT_RATIO, Math.min(MAX_TREE_SPLIT_RATIO, next));
  safeSet(TREE_SPLIT_RATIO_KEY, String(clamped));
}

export function readStoredModelOutlinerAnimationsBlockExpanded(): boolean {
  const raw = safeGet(ANIMATIONS_BLOCK_EXPANDED_KEY);
  if (raw === "0") {
    return false;
  }
  if (raw === "1") {
    return true;
  }
  return true;
}

export function writeStoredModelOutlinerAnimationsBlockExpanded(next: boolean): void {
  safeSet(ANIMATIONS_BLOCK_EXPANDED_KEY, next ? "1" : "0");
}
