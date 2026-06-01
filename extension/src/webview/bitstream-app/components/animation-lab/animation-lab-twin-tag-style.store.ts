import { create } from "zustand";
import {
  persistAnimationLabTwinTagStyles,
  readAnimationLabTwinTagStyles,
  type AnimationLabTwinTagStylesSnapshot,
} from "./animation-lab-twin-tag-style.persistence.js";
import {
  isAnimationLabTwinTagPresetId,
  resolveTwinTagPresetDef,
  type AnimationLabTwinTagPresetId,
} from "./animation-lab-twin-tag-presets.js";
import type {
  AnimationLabTwinTagComponentStyle,
  AnimationLabTwinTagGlobalStyle,
} from "./animation-lab-twin-tag-style.types.js";

type AnimationLabTwinTagStyleStoreState = {
  scopeKey: string;
  global: AnimationLabTwinTagGlobalStyle;
  byComponent: Record<string, AnimationLabTwinTagComponentStyle>;
  loadScope: (scopeKey: string) => void;
  patchGlobal: (patch: Partial<AnimationLabTwinTagGlobalStyle>) => void;
  applyTagPreset: (presetId: AnimationLabTwinTagPresetId) => void;
  resetGlobal: () => void;
  patchComponent: (componentId: string, patch: Partial<AnimationLabTwinTagComponentStyle>) => void;
  resetComponent: (componentId: string) => void;
  resetAll: () => void;
};

function persistScope(scopeKey: string, snapshot: AnimationLabTwinTagStylesSnapshot): void {
  if (scopeKey.length === 0) {
    return;
  }
  persistAnimationLabTwinTagStyles(scopeKey, snapshot);
}

export const useAnimationLabTwinTagStyleStore = create<AnimationLabTwinTagStyleStoreState>(
  (set, get) => ({
    scopeKey: "",
    global: {},
    byComponent: {},
    loadScope: (scopeKey) => {
      const trimmed = scopeKey.trim();
      if (trimmed.length === 0) {
        set({ scopeKey: "", global: {}, byComponent: {} });
        return;
      }
      const snapshot = readAnimationLabTwinTagStyles(trimmed);
      set({
        scopeKey: trimmed,
        global: snapshot.global,
        byComponent: snapshot.byComponent,
      });
    },
    patchGlobal: (patch) => {
      set((state) => {
        const global = { ...state.global, ...patch };
        const snapshot = { global, byComponent: state.byComponent };
        persistScope(state.scopeKey, snapshot);
        return { global };
      });
    },
    applyTagPreset: (presetId) => {
      if (!isAnimationLabTwinTagPresetId(presetId)) {
        return;
      }
      const preset = resolveTwinTagPresetDef({ presetId });
      set((state) => {
        const global: AnimationLabTwinTagGlobalStyle = {
          ...state.global,
          presetId: preset.id,
          widthPx: preset.globalDefaults.widthPx,
          minHeightPx: preset.globalDefaults.minHeightPx,
          titleFontPx: preset.globalDefaults.titleFontPx,
          statusFontPx: preset.globalDefaults.statusFontPx,
          signalFontPx: preset.globalDefaults.signalFontPx,
        };
        const snapshot = { global, byComponent: state.byComponent };
        persistScope(state.scopeKey, snapshot);
        return { global };
      });
    },
    resetGlobal: () => {
      set((state) => {
        const snapshot = { global: {}, byComponent: state.byComponent };
        persistScope(state.scopeKey, snapshot);
        return { global: {} };
      });
    },
    patchComponent: (componentId, patch) => {
      const id = componentId.trim();
      if (id.length === 0) {
        return;
      }
      set((state) => {
        const prev = state.byComponent[id] ?? {};
        const byComponent = { ...state.byComponent, [id]: { ...prev, ...patch } };
        const snapshot = { global: state.global, byComponent };
        persistScope(state.scopeKey, snapshot);
        return { byComponent };
      });
    },
    resetComponent: (componentId) => {
      const id = componentId.trim();
      if (id.length === 0) {
        return;
      }
      set((state) => {
        const byComponent = { ...state.byComponent };
        delete byComponent[id];
        const snapshot = { global: state.global, byComponent };
        persistScope(state.scopeKey, snapshot);
        return { byComponent };
      });
    },
    resetAll: () => {
      const { scopeKey } = get();
      set({ global: {}, byComponent: {} });
      persistScope(scopeKey, { global: {}, byComponent: {} });
    },
  }),
);

export function applyTagStyleOffsetsToPositions(
  positions: Record<string, import("three").Vector3>,
  byComponent: Record<string, AnimationLabTwinTagComponentStyle>,
): Record<string, import("three").Vector3> {
  let changed = false;
  const out: Record<string, import("three").Vector3> = { ...positions };
  for (const [componentId, pos] of Object.entries(positions)) {
    const style = byComponent[componentId];
    if (style == null) {
      continue;
    }
    const ox = style.offsetX ?? 0;
    const oy = style.offsetY ?? 0;
    const oz = style.offsetZ ?? 0;
    if (ox === 0 && oy === 0 && oz === 0) {
      continue;
    }
    changed = true;
    out[componentId] = pos.clone();
    out[componentId].x += ox;
    out[componentId].y += oy;
    out[componentId].z += oz;
  }
  return changed ? out : positions;
}
