import {
  getEngineEnvironmentDefaultCubeMapIndex,
  getEngineEnvironmentIntensity,
} from "@/engine-environment/t3dEngineEnvironment";

const PERSISTENCE_VERSION = 'v1';

export const SETTINGS_KEYS = {
  mainEnvironment: `t3d:webview:main-environment:${PERSISTENCE_VERSION}`,
  modelPreview: `t3d:webview:model-preview:${PERSISTENCE_VERSION}`,
} as const;

export type PreviewClickTargetMode = 'object-origin' | 'hit-point';
export type PreviewFovSourceMode = 'model' | 'saved';
export type PreviewSelectionHighlightMode =
  | 'off'
  | 'emissive'
  | 'edges'
  | 'wireframe'
  | 'box'
  | 'outline';
export type PreviewModelDisplayMode = 'shaded' | 'wireframe' | 'shaded-wireframe';
export type AnimationBlendMode = 'single' | 'blend';
export type AnimationClipLoop = 'loop' | 'once' | number;

export interface MainEnvironmentSettings {
  envPresetIndex: number;
  envIntensity: number;
  envEnableHDRI: boolean;
  envEnablePBR: boolean;
}

export interface ModelPreviewSettings {
  previewFov: number;
  previewFovSource: PreviewFovSourceMode;
  clickTargetMode: PreviewClickTargetMode;
  selectionHighlightMode: PreviewSelectionHighlightMode;
  modelDisplayMode: PreviewModelDisplayMode;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  pivotRetargetDurationMs: number;
  envPresetIndex: number;
  envIntensity: number;
  envEnableHDRI: boolean;
  envEnablePBR: boolean;
  solidBackgroundColor: string;
  // Animation controller
  animationBlendMode: AnimationBlendMode;
  animationClipWeights: number[];
  animationClipSpeeds: number[];
  animationClipLoops: AnimationClipLoop[];
  animationCrossfadeDuration: number;
  animationBlendCompactView: boolean;
}

export function getMainEnvironmentDefaults(): MainEnvironmentSettings {
  return {
    envPresetIndex: getEngineEnvironmentDefaultCubeMapIndex(),
    envIntensity: getEngineEnvironmentIntensity(),
    envEnableHDRI: true,
    envEnablePBR: true,
  };
}

export function getModelPreviewDefaults(): ModelPreviewSettings {
  return {
    previewFov: 40,
    previewFovSource: 'saved',
    clickTargetMode: 'object-origin',
    selectionHighlightMode: 'emissive',
    modelDisplayMode: 'shaded',
    leftPanelOpen: true,
    rightPanelOpen: true,
    pivotRetargetDurationMs: 2000,
    envPresetIndex: getEngineEnvironmentDefaultCubeMapIndex(),
    envIntensity: getEngineEnvironmentIntensity(),
    envEnableHDRI: true,
    envEnablePBR: true,
    solidBackgroundColor: '#0f172a',
    animationBlendMode: 'blend',
    animationClipWeights: [],
    animationClipSpeeds: [],
    animationClipLoops: [],
    animationCrossfadeDuration: 0.3,
    animationBlendCompactView: false,
  };
}

export function loadPersistedSettings<T extends Record<string, unknown>>(
  key: string,
  defaults: T
): T {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return { ...defaults };
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...defaults, ...parsed };
  } catch (error) {
    console.warn('[settings] Failed to load persisted settings', { key, error });
    return { ...defaults };
  }
}

export function savePersistedSettings<T extends Record<string, unknown>>(
  key: string,
  value: T
): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[settings] Failed to save persisted settings', { key, error });
  }
}
