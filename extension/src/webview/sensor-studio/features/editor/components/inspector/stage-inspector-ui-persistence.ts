/** Persists Stage inspector tab and draggable card order per tab. */

import type { Scene3dInspectorPanelId } from "./node-inspector-ui-persistence";

const PREFIX = "ternion.sensor-studio.stageInspector.";

const KEYS = {
  workbenchInspectorTab: `${PREFIX}workbenchInspectorTab.v1`,
  workbenchFlowSplitRatio: `${PREFIX}workbenchFlowSplitRatio.v1`,
  activeTab: `${PREFIX}activeTab.v1`,
  overviewCardOrder: `${PREFIX}overviewTab.cardOrder.v1`,
  overviewCardCollapsed: `${PREFIX}overviewTab.cardCollapsed.v1`,
  scene3dCardOrder: `${PREFIX}scene3dTab.cardOrder.v1`,
  scene3dCardCollapsed: `${PREFIX}scene3dTab.cardCollapsed.v1`,
  toolbarCardOrder: `${PREFIX}toolbarTab.cardOrder.v1`,
  toolbarCardCollapsed: `${PREFIX}toolbarTab.cardCollapsed.v1`,
} as const;

export type StageInspectorTab = "overview" | "scene3d" | "toolbar";

export type StageWorkbenchInspectorTab = "selection" | "scene";

export function readStoredStageWorkbenchInspectorTab(): StageWorkbenchInspectorTab {
  const raw = safeGet(KEYS.workbenchInspectorTab);
  if (raw === "selection" || raw === "scene") {
    return raw;
  }
  return "scene";
}

export function writeStoredStageWorkbenchInspectorTab(tab: StageWorkbenchInspectorTab): void {
  safeSet(KEYS.workbenchInspectorTab, tab);
}

const DEFAULT_WORKBENCH_FLOW_SPLIT_RATIO = 0.58;

export function readStoredStageWorkbenchFlowSplitRatio(): number {
  const raw = safeGet(KEYS.workbenchFlowSplitRatio);
  if (raw == null || raw.length === 0) {
    return DEFAULT_WORKBENCH_FLOW_SPLIT_RATIO;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_WORKBENCH_FLOW_SPLIT_RATIO;
}

export function writeStoredStageWorkbenchFlowSplitRatio(ratio: number): void {
  safeSet(KEYS.workbenchFlowSplitRatio, String(ratio));
}

export function readStoredStageInspectorTab(): StageInspectorTab {
  const raw = safeGet(KEYS.activeTab);
  if (raw === "overview" || raw === "scene3d" || raw === "toolbar") {
    return raw;
  }
  return "overview";
}

export function writeStoredStageInspectorTab(tab: StageInspectorTab): void {
  safeSet(KEYS.activeTab, tab);
}

export type StageInspectorOverviewCardId = "committed-scene";

export const DEFAULT_STAGE_OVERVIEW_CARD_ORDER: readonly StageInspectorOverviewCardId[] = [
  "committed-scene",
];

export type StageInspectorScene3dCardId = Scene3dInspectorPanelId;

export const DEFAULT_STAGE_SCENE3D_CARD_ORDER: readonly StageInspectorScene3dCardId[] = [
  "model",
  "environment",
  "renderer",
  "camera",
  "orbit",
  "lights",
  "helpers",
];

export type StageInspectorToolbarCardId = "presentation-policy";

export const DEFAULT_STAGE_TOOLBAR_CARD_ORDER: readonly StageInspectorToolbarCardId[] = [
  "presentation-policy",
];

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
    /* ignore */
  }
}

function readCardOrder<T extends string>(
  key: string,
  defaultOrder: readonly T[],
  isId: (value: string) => value is T,
): T[] {
  const raw = safeGet(key);
  if (raw == null || raw.length === 0) {
    return [...defaultOrder];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...defaultOrder];
    }
    const out: T[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && isId(item) && !out.includes(item)) {
        out.push(item);
      }
    }
    for (const id of defaultOrder) {
      if (!out.includes(id)) {
        out.push(id);
      }
    }
    return out;
  } catch {
    return [...defaultOrder];
  }
}

function writeCardOrder<T extends string>(key: string, order: readonly T[]): void {
  safeSet(key, JSON.stringify([...order]));
}

function readCardCollapsed<T extends string>(
  key: string,
  defaultOrder: readonly T[],
): Record<T, boolean> {
  const base = Object.fromEntries(defaultOrder.map((id) => [id, false])) as Record<T, boolean>;
  const raw = safeGet(key);
  if (raw == null || raw.length === 0) {
    return base;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return base;
    }
    const obj = parsed as Record<string, unknown>;
    for (const id of defaultOrder) {
      if (obj[id] === true) {
        base[id] = true;
      }
    }
    return base;
  } catch {
    return base;
  }
}

function writeCardCollapsed<T extends string>(key: string, next: Record<T, boolean>): void {
  safeSet(key, JSON.stringify(next));
}

const OVERVIEW_IDS = new Set<string>(DEFAULT_STAGE_OVERVIEW_CARD_ORDER);
function isOverviewCardId(value: string): value is StageInspectorOverviewCardId {
  return OVERVIEW_IDS.has(value);
}

const SCENE3D_IDS = new Set<string>(DEFAULT_STAGE_SCENE3D_CARD_ORDER);
function isScene3dCardId(value: string): value is StageInspectorScene3dCardId {
  return SCENE3D_IDS.has(value);
}

const TOOLBAR_IDS = new Set<string>(DEFAULT_STAGE_TOOLBAR_CARD_ORDER);
function isToolbarCardId(value: string): value is StageInspectorToolbarCardId {
  return TOOLBAR_IDS.has(value);
}

export function readStageOverviewCardOrder(): StageInspectorOverviewCardId[] {
  return readCardOrder(KEYS.overviewCardOrder, DEFAULT_STAGE_OVERVIEW_CARD_ORDER, isOverviewCardId);
}

export function writeStageOverviewCardOrder(order: readonly StageInspectorOverviewCardId[]): void {
  writeCardOrder(KEYS.overviewCardOrder, order);
}

export function readStageOverviewCardCollapsed(): Record<StageInspectorOverviewCardId, boolean> {
  return readCardCollapsed(KEYS.overviewCardCollapsed, DEFAULT_STAGE_OVERVIEW_CARD_ORDER);
}

export function writeStageOverviewCardCollapsed(
  next: Record<StageInspectorOverviewCardId, boolean>,
): void {
  writeCardCollapsed(KEYS.overviewCardCollapsed, next);
}

export function readStageScene3dCardOrder(): StageInspectorScene3dCardId[] {
  return readCardOrder(KEYS.scene3dCardOrder, DEFAULT_STAGE_SCENE3D_CARD_ORDER, isScene3dCardId);
}

export function writeStageScene3dCardOrder(order: readonly StageInspectorScene3dCardId[]): void {
  writeCardOrder(KEYS.scene3dCardOrder, order);
}

export function readStageScene3dCardCollapsed(): Record<StageInspectorScene3dCardId, boolean> {
  return readCardCollapsed(KEYS.scene3dCardCollapsed, DEFAULT_STAGE_SCENE3D_CARD_ORDER);
}

export function writeStageScene3dCardCollapsed(
  next: Record<StageInspectorScene3dCardId, boolean>,
): void {
  writeCardCollapsed(KEYS.scene3dCardCollapsed, next);
}

export function readStageToolbarCardOrder(): StageInspectorToolbarCardId[] {
  return readCardOrder(KEYS.toolbarCardOrder, DEFAULT_STAGE_TOOLBAR_CARD_ORDER, isToolbarCardId);
}

export function writeStageToolbarCardOrder(order: readonly StageInspectorToolbarCardId[]): void {
  writeCardOrder(KEYS.toolbarCardOrder, order);
}

export function readStageToolbarCardCollapsed(): Record<StageInspectorToolbarCardId, boolean> {
  return readCardCollapsed(KEYS.toolbarCardCollapsed, DEFAULT_STAGE_TOOLBAR_CARD_ORDER);
}

export function writeStageToolbarCardCollapsed(
  next: Record<StageInspectorToolbarCardId, boolean>,
): void {
  writeCardCollapsed(KEYS.toolbarCardCollapsed, next);
}

export function mergeStageScene3dCardOrder(
  stored: readonly StageInspectorScene3dCardId[],
  visible: readonly StageInspectorScene3dCardId[] = DEFAULT_STAGE_SCENE3D_CARD_ORDER,
): StageInspectorScene3dCardId[] {
  const visibleSet = new Set(visible);
  const ordered = stored.filter((id) => visibleSet.has(id));
  for (const id of visible) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
}

export const STAGE_SCENE3D_CARD_HINTS: Record<StageInspectorScene3dCardId, string> = {
  model: "GLB catalog, URL, transform, and embedded rig policy for the preview model.",
  environment: "Cubemap preset, backdrop texture, and image-based lighting.",
  renderer: "Antialias, shadows, tone mapping, exposure, pixel ratio, and clear color.",
  camera: "Perspective camera position, target, and clip planes.",
  orbit: "OrbitControls mouse/touch mapping, speeds, distance limits, and auto-rotate.",
  lights: "Studio light preset, ambient, hemisphere, and directional list.",
  helpers: "Grid, axes, camera frustum, and directional light helpers.",
};

export const STAGE_SCENE3D_CARD_TITLES: Record<StageInspectorScene3dCardId, string> = {
  model: "Model",
  environment: "Environment",
  renderer: "Renderer",
  camera: "Camera",
  orbit: "Orbit controls",
  lights: "Lights",
  helpers: "Helpers",
};
