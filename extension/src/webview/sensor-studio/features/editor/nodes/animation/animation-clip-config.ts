import {
  coerceFlowWireAnimationV1,
  type FlowWireAnimationV1,
  type StudioGlbAnimationLoopModeV1,
} from "./flow-wire-animation";
import {
  readGlbExtractTag,
  STUDIO_GLB_EXTRACT_REF_KEY,
} from "../../model/model-generated-bindings";

export const ANIMATION_CLIP_NAME_KEY = "clipName" as const;

export type AnimationClipNodeConfig = {
  clipName: string;
  timeS: number;
  speed: number;
  weight: number;
  loopMode: StudioGlbAnimationLoopModeV1;
  enabled: boolean;
};

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readLoopMode(raw: unknown): StudioGlbAnimationLoopModeV1 {
  if (raw === "once" || raw === "loop" || raw === "pingpong") {
    return raw;
  }
  return "loop";
}

/** Resolve bound GLB clip name from extract tag or explicit config. */
export function readAnimationClipName(config: Record<string, unknown> | null | undefined): string {
  const tag = readGlbExtractTag(config);
  if (tag?.kind === "animation" && tag.ref.trim().length > 0) {
    return tag.ref.trim();
  }
  const explicit = config?.[ANIMATION_CLIP_NAME_KEY] ?? config?.[STUDIO_GLB_EXTRACT_REF_KEY];
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    return explicit.trim();
  }
  return "";
}

export function readAnimationClipNodeConfig(
  config: Record<string, unknown> | null | undefined,
): AnimationClipNodeConfig {
  return {
    clipName: readAnimationClipName(config),
    timeS: Math.max(0, readFinite(config?.timeS, 0)),
    speed: readFinite(config?.speed, 1),
    weight: Math.min(1, Math.max(0, readFinite(config?.weight, 1))),
    loopMode: readLoopMode(config?.loopMode),
    enabled: config?.enabled !== false,
  };
}

export type AnimationClipWiredInputs = {
  timeS?: number;
  speed?: number;
  weight?: number;
  enabled?: boolean;
};

/** Build a partial `glbAnimation` wire for one clip (Phase A — single-clip node). */
export function flowAnimationWireFromAnimationClipEval(args: {
  defaultConfig: Record<string, unknown>;
  wired?: AnimationClipWiredInputs;
}): FlowWireAnimationV1 | null {
  const parsed = readAnimationClipNodeConfig(args.defaultConfig);
  const clipName = parsed.clipName;
  if (clipName.length === 0) {
    return null;
  }

  const wired = args.wired ?? {};
  const timeS =
    typeof wired.timeS === "number" && Number.isFinite(wired.timeS)
      ? Math.max(0, wired.timeS)
      : parsed.timeS;
  const speed =
    typeof wired.speed === "number" && Number.isFinite(wired.speed)
      ? wired.speed
      : parsed.speed;
  const weight =
    typeof wired.weight === "number" && Number.isFinite(wired.weight)
      ? Math.min(1, Math.max(0, wired.weight))
      : parsed.weight;
  const enabled =
    typeof wired.enabled === "boolean" ? wired.enabled : parsed.enabled;

  return coerceFlowWireAnimationV1({
    version: 1,
    clips: {
      [clipName]: {
        timeS,
        speed,
        weight,
        loopMode: parsed.loopMode,
        enabled,
      },
    },
    playbackMode: "per-clip",
  });
}
