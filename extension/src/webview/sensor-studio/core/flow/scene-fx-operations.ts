import { readValueNormalizerInput } from "./value-normalizer-operations";

export const MORPH_WEIGHT_DEFAULT = 0;

export function evaluateMorphWeight(wired: unknown, configValue: unknown): number {
  const raw = readValueNormalizerInput(wired, configValue, MORPH_WEIGHT_DEFAULT);
  return Math.max(0, Math.min(1, raw));
}

export const SCENE_LIGHT_DEFAULTS = {
  intensity: 1,
  r: 1,
  g: 1,
  b: 1,
  x: 0,
  y: 5,
  z: 0,
} as const;

export function evaluateSceneLightOutputs(
  intensityWired: unknown,
  intensityCfg: unknown,
  rWired: unknown,
  rCfg: unknown,
  gWired: unknown,
  gCfg: unknown,
  bWired: unknown,
  bCfg: unknown,
  xWired: unknown,
  xCfg: unknown,
  yWired: unknown,
  yCfg: unknown,
  zWired: unknown,
  zCfg: unknown,
): typeof SCENE_LIGHT_DEFAULTS {
  return {
    intensity: readValueNormalizerInput(intensityWired, intensityCfg, SCENE_LIGHT_DEFAULTS.intensity),
    r: readValueNormalizerInput(rWired, rCfg, SCENE_LIGHT_DEFAULTS.r),
    g: readValueNormalizerInput(gWired, gCfg, SCENE_LIGHT_DEFAULTS.g),
    b: readValueNormalizerInput(bWired, bCfg, SCENE_LIGHT_DEFAULTS.b),
    x: readValueNormalizerInput(xWired, xCfg, SCENE_LIGHT_DEFAULTS.x),
    y: readValueNormalizerInput(yWired, yCfg, SCENE_LIGHT_DEFAULTS.y),
    z: readValueNormalizerInput(zWired, zCfg, SCENE_LIGHT_DEFAULTS.z),
  };
}

export const CAMERA_SWITCH_SLOT_COUNT = 8;

export function evaluateCameraSwitchIndex(wired: unknown, configValue: unknown): number {
  const raw = readValueNormalizerInput(wired, configValue, 0);
  return Math.max(0, Math.min(CAMERA_SWITCH_SLOT_COUNT - 1, Math.floor(raw)));
}

export const POST_PROCESSING_DEFAULTS = {
  bloomIntensity: 1.5,
  bloomThreshold: 1.0,
} as const;

export function evaluatePostProcessingOutputs(
  bloomIntensityWired: unknown,
  bloomIntensityCfg: unknown,
  bloomThresholdWired: unknown,
  bloomThresholdCfg: unknown,
): typeof POST_PROCESSING_DEFAULTS {
  return {
    bloomIntensity: readValueNormalizerInput(
      bloomIntensityWired,
      bloomIntensityCfg,
      POST_PROCESSING_DEFAULTS.bloomIntensity,
    ),
    bloomThreshold: readValueNormalizerInput(
      bloomThresholdWired,
      bloomThresholdCfg,
      POST_PROCESSING_DEFAULTS.bloomThreshold,
    ),
  };
}

export const CONTACT_SHADOWS_DEFAULTS = {
  opacity: 1.0,
  blur: 2.0,
  far: 10.0,
  scale: 10.0,
} as const;

export function evaluateContactShadowsOutputs(cfg: Record<string, unknown>): typeof CONTACT_SHADOWS_DEFAULTS {
  return {
    opacity: readValueNormalizerInput(null, cfg.opacity, CONTACT_SHADOWS_DEFAULTS.opacity),
    blur: readValueNormalizerInput(null, cfg.blur, CONTACT_SHADOWS_DEFAULTS.blur),
    far: readValueNormalizerInput(null, cfg.far, CONTACT_SHADOWS_DEFAULTS.far),
    scale: readValueNormalizerInput(null, cfg.scale, CONTACT_SHADOWS_DEFAULTS.scale),
  };
}

export const EMITTER_DEFAULTS = {
  trigger: 0,
  rate: 0,
} as const;

export function evaluateEmitterOutputs(
  triggerWired: unknown,
  triggerCfg: unknown,
  rateWired: unknown,
  rateCfg: unknown,
): typeof EMITTER_DEFAULTS {
  return {
    trigger: readValueNormalizerInput(triggerWired, triggerCfg, EMITTER_DEFAULTS.trigger),
    rate: readValueNormalizerInput(rateWired, rateCfg, EMITTER_DEFAULTS.rate),
  };
}

export const UV_TRANSFORM_KEYS = [
  "uvScaleU",
  "uvScaleV",
  "uvOffsetU",
  "uvOffsetV",
  "uvRotation",
] as const;

export type UvTransformKey = (typeof UV_TRANSFORM_KEYS)[number];

export const UV_TRANSFORM_DEFAULTS: Record<UvTransformKey, number> = {
  uvScaleU: 1,
  uvScaleV: 1,
  uvOffsetU: 0,
  uvOffsetV: 0,
  uvRotation: 0,
};

export function evaluateUvTransformOutputs(
  cfg: Record<string, unknown>,
  readWired: (key: UvTransformKey) => unknown,
): Record<UvTransformKey, number> {
  const out = {} as Record<UvTransformKey, number>;
  for (const key of UV_TRANSFORM_KEYS) {
    out[key] = readValueNormalizerInput(readWired(key), cfg[key], UV_TRANSFORM_DEFAULTS[key]);
  }
  return out;
}

export function evaluateMaterialVariantName(wired: unknown, configValue: unknown): string {
  if (typeof wired === "string") {
    return wired.trim();
  }
  if (typeof wired === "number" && Number.isFinite(wired)) {
    return String(wired);
  }
  if (typeof configValue === "string") {
    return configValue.trim();
  }
  return String(configValue ?? "").trim();
}
