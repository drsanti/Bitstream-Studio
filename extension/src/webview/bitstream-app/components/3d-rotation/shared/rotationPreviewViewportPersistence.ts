import {
  clampEngineCubemapPresetIndex,
  getEngineEnvironmentDefaultCubeMapIndex,
} from "@/engine-environment/t3dEngineEnvironment";
import {
  ORIENTATION_PREVIEW_MAPPING_DEFAULT,
  ORIENTATION_PREVIEW_MAPPING_MODES,
  type OrientationPreviewMappingMode,
} from "./orientationPreviewMapping.js";
import { ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL } from "./rotationPreviewConstants.js";

/** Shared toolbar prefs across Quaternion / Euler rotation previews (Bitstream + split). */
export const ROTATION_PREVIEW_SHARED_STORAGE_PREFIX = "bitstream:rotation-preview";

export const ROTATION_PREVIEW_SHARED_KEYS = {
  showGrid: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:show-grid`,
  showBackgroundTexture: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:show-background-texture`,
  cubemapIbl: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:cubemap-ibl`,
  slerpEnabled: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:slerp-enabled`,
  envPresetIndex: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:env-preset-index`,
  previewBodyModelId: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:preview-body-model-id`,
  orientationMappingMode: `${ROTATION_PREVIEW_SHARED_STORAGE_PREFIX}:orientation-mapping-mode`,
} as const;

function isOrientationPreviewMappingMode(
  raw: string,
): raw is OrientationPreviewMappingMode {
  return (ORIENTATION_PREVIEW_MAPPING_MODES as readonly string[]).includes(raw);
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function readBoolFromKeys(keys: readonly string[], fallback: boolean): boolean {
  for (const key of keys) {
    const raw = readRaw(key);
    if (raw === "0") {
      return false;
    }
    if (raw === "1") {
      return true;
    }
  }
  return fallback;
}

function legacyBoolKeys(viewportKey: string, suffix: string): string[] {
  return [
    `${viewportKey}:${suffix}`,
    `bitstream:viewport-hud:Quaternion:${suffix}`,
    `bitstream:viewport-hud:Euler:${suffix}`,
    `bitstream:viewport-hud:Euler ZYX:${suffix}`,
    `bitstream:viewport-hud:quaternion-solo:${suffix}`,
    `bitstream:viewport-hud:quaternion-split:${suffix}`,
    `bitstream:viewport-hud:euler-solo:${suffix}`,
    `bitstream:viewport-hud:euler-split:${suffix}`,
  ];
}

export function persistRotationPreviewBool(
  sharedKey: string,
  value: boolean,
  legacyKeys: readonly string[] = [],
): void {
  writeRaw(sharedKey, value ? "1" : "0");
  for (const legacy of legacyKeys) {
    if (legacy !== sharedKey) {
      writeRaw(legacy, value ? "1" : "0");
    }
  }
}

export function readRotationPreviewShowGrid(viewportStorageKey: string): boolean {
  return readBoolFromKeys(
    [ROTATION_PREVIEW_SHARED_KEYS.showGrid, ...legacyBoolKeys(viewportStorageKey, "show-grid")],
    true,
  );
}

export function readRotationPreviewShowBackgroundTexture(
  viewportStorageKey: string,
): boolean {
  return readBoolFromKeys(
    [
      ROTATION_PREVIEW_SHARED_KEYS.showBackgroundTexture,
      ...legacyBoolKeys(viewportStorageKey, "show-background-texture"),
    ],
    true,
  );
}

export function readRotationPreviewUseCubemapIbl(viewportStorageKey: string): boolean {
  return readBoolFromKeys(
    [
      ROTATION_PREVIEW_SHARED_KEYS.cubemapIbl,
      ...legacyBoolKeys(viewportStorageKey, "cubemap-ibl"),
    ],
    ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
  );
}

export function readRotationPreviewSlerpEnabled(viewportStorageKey: string): boolean {
  return readBoolFromKeys(
    [
      ROTATION_PREVIEW_SHARED_KEYS.slerpEnabled,
      ...legacyBoolKeys(viewportStorageKey, "slerp-enabled"),
    ],
    false,
  );
}

export function readRotationPreviewEnvPresetIndex(viewportStorageKey: string): number {
  const keys = [
    ROTATION_PREVIEW_SHARED_KEYS.envPresetIndex,
    `${viewportStorageKey}:env-preset-index`,
    "bitstream:viewport-hud:Quaternion:env-preset-index",
    "bitstream:viewport-hud:Euler:env-preset-index",
    "bitstream:viewport-hud:quaternion-solo:env-preset-index",
    "bitstream:viewport-hud:quaternion-split:env-preset-index",
    "bitstream:viewport-hud:euler-solo:env-preset-index",
    "bitstream:viewport-hud:euler-split:env-preset-index",
  ];
  for (const key of keys) {
    const raw = readRaw(key);
    if (raw != null) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n)) {
        return clampEngineCubemapPresetIndex(n);
      }
    }
  }
  return clampEngineCubemapPresetIndex(getEngineEnvironmentDefaultCubeMapIndex());
}

export function persistRotationPreviewEnvPresetIndex(
  value: number,
  viewportStorageKey: string,
): void {
  const clamped = clampEngineCubemapPresetIndex(value);
  const payload = String(clamped);
  writeRaw(ROTATION_PREVIEW_SHARED_KEYS.envPresetIndex, payload);
  writeRaw(`${viewportStorageKey}:env-preset-index`, payload);
}

export function readRotationPreviewBodyModelId(
  viewportStorageKey: string,
  defaultModelId: string,
): string {
  const keys = [
    ROTATION_PREVIEW_SHARED_KEYS.previewBodyModelId,
    `${viewportStorageKey}:preview-body-model-id`,
    "bitstream:viewport-hud:Quaternion:preview-body-model-id",
    "bitstream:viewport-hud:Euler:preview-body-model-id",
    "bitstream:viewport-hud:quaternion-solo:preview-body-model-id",
    "bitstream:viewport-hud:quaternion-split:preview-body-model-id",
    "bitstream:viewport-hud:euler-solo:preview-body-model-id",
    "bitstream:viewport-hud:euler-split:preview-body-model-id",
  ];
  for (const key of keys) {
    const raw = readRaw(key);
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
  }
  return defaultModelId;
}

export function persistRotationPreviewBodyModelId(
  modelId: string,
  viewportStorageKey: string,
): void {
  writeRaw(ROTATION_PREVIEW_SHARED_KEYS.previewBodyModelId, modelId);
  writeRaw(`${viewportStorageKey}:preview-body-model-id`, modelId);
}

export function readRotationPreviewOrientationMappingMode(
  viewportStorageKey: string,
): OrientationPreviewMappingMode {
  const keys = [
    ROTATION_PREVIEW_SHARED_KEYS.orientationMappingMode,
    `${viewportStorageKey}:orientation-mapping-mode`,
  ];
  for (const key of keys)
  {
    const raw = readRaw(key);
    if (raw != null && isOrientationPreviewMappingMode(raw))
    {
      return raw;
    }
  }
  return ORIENTATION_PREVIEW_MAPPING_DEFAULT;
}

export function persistRotationPreviewOrientationMappingMode(
  mode: OrientationPreviewMappingMode,
  viewportStorageKey: string,
): void {
  writeRaw(ROTATION_PREVIEW_SHARED_KEYS.orientationMappingMode, mode);
  writeRaw(`${viewportStorageKey}:orientation-mapping-mode`, mode);
}

export function cycleRotationPreviewOrientationMappingMode(
  current: OrientationPreviewMappingMode,
): OrientationPreviewMappingMode {
  const idx = ORIENTATION_PREVIEW_MAPPING_MODES.indexOf(current);
  const next =
    ORIENTATION_PREVIEW_MAPPING_MODES[
      (idx + 1) % ORIENTATION_PREVIEW_MAPPING_MODES.length
    ];
  return next ?? ORIENTATION_PREVIEW_MAPPING_DEFAULT;
}
