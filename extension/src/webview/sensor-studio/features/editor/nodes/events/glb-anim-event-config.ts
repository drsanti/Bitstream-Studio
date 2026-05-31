import type { StudioGlbAnimationLoopModeV1 } from "../animation/flow-wire-animation";
import type { GlbAnimationClipPreviewDrive } from "../../gltf/studio-glb-animation-preview-mixer";

export function readGlbAnimTriggerNonce(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig.triggerNonce;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.floor(raw);
  }
  return 0;
}

export function readGlbAnimEventSpeed(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig.speed;
  if (typeof raw === "number" && Number.isFinite(raw) && Math.abs(raw) < 1e6) {
    return raw;
  }
  return 1;
}

export function readGlbAnimEventWeight(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig.weight;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.min(1, Math.max(0, raw));
  }
  return 1;
}

export function readGlbAnimEventLoopMode(defaultConfig: Record<string, unknown>): StudioGlbAnimationLoopModeV1 {
  const raw = defaultConfig.loopMode;
  if (raw === "once" || raw === "loop" || raw === "pingpong") {
    return raw;
  }
  return "once";
}

/** Build a structured mixer drive after at least one event trigger (`triggerNonce` > 0). */
export function buildGlbAnimEventPreviewDrive(
  defaultConfig: Record<string, unknown>,
): GlbAnimationClipPreviewDrive | null {
  const nonce = readGlbAnimTriggerNonce(defaultConfig);
  if (nonce <= 0) {
    return null;
  }
  return {
    timeS: 0,
    speed: readGlbAnimEventSpeed(defaultConfig),
    loopMode: readGlbAnimEventLoopMode(defaultConfig),
    weight: readGlbAnimEventWeight(defaultConfig),
    trimStartS: 0,
    trimEndS: -1,
    fadeInS: 0,
    fadeOutS: 0,
    restartNonce: nonce,
    holdTime: false,
  };
}

export function nextGlbAnimEventTriggerConfig(
  defaultConfig: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...defaultConfig,
    triggerNonce: readGlbAnimTriggerNonce(defaultConfig) + 1,
  };
}
