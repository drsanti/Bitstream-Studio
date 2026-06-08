import {
  readGlbExtractTag,
  STUDIO_GLB_EXTRACT_REF_KEY,
} from "../../model/model-generated-bindings";
import type { GlbPartSpinDriveRow } from "../../gltf/studio-glb-preview-runtime";

export const PART_SPIN_AXIS_KEY = "spinAxis" as const;
export const PART_SPIN_SPEED_RAD_S_KEY = "speedRadS" as const;
export const PART_SPIN_REVERSE_KEY = "reverse" as const;
export const PART_SPIN_ENABLED_KEY = "enabled" as const;

export type StudioGlbPartSpinAxisV1 = "x" | "y" | "z";

export type PartSpinNodeConfig = {
  partPath: string;
  axis: StudioGlbPartSpinAxisV1;
  speedRadS: number;
  reverse: boolean;
  enabled: boolean;
};

function readFinite(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readAxis(raw: unknown): StudioGlbPartSpinAxisV1 {
  if (raw === "x" || raw === "y" || raw === "z") {
    return raw;
  }
  return "y";
}

/** Resolve bound GLB part path from extract tag or explicit ref. */
export function readPartSpinPath(
  config: Record<string, unknown> | null | undefined,
): string {
  const tag = readGlbExtractTag(config);
  if (tag?.kind === "part" && tag.ref.trim().length > 0) {
    return tag.ref.trim();
  }
  const explicit = config?.[STUDIO_GLB_EXTRACT_REF_KEY];
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    return explicit.trim();
  }
  return "";
}

export function readPartSpinNodeConfig(
  config: Record<string, unknown> | null | undefined,
): PartSpinNodeConfig {
  const speedRaw = readFinite(config?.[PART_SPIN_SPEED_RAD_S_KEY], Math.PI * 2);
  return {
    partPath: readPartSpinPath(config),
    axis: readAxis(config?.[PART_SPIN_AXIS_KEY]),
    speedRadS: speedRaw,
    reverse: config?.[PART_SPIN_REVERSE_KEY] === true,
    enabled: config?.[PART_SPIN_ENABLED_KEY] !== false,
  };
}

export type PartSpinWiredInputs = {
  speedRadS?: number;
  enabled?: boolean;
};

/** Evaluate one **Part Spin** node into a preview drive row (scene frame, not `glbAnimation`). */
export function evaluatePartSpinDrive(args: {
  defaultConfig: Record<string, unknown>;
  wired?: PartSpinWiredInputs;
}): { partPath: string; row: GlbPartSpinDriveRow } | null {
  const parsed = readPartSpinNodeConfig(args.defaultConfig);
  if (parsed.partPath.length === 0) {
    return null;
  }

  const wired = args.wired ?? {};
  const speedRaw =
    typeof wired.speedRadS === "number" && Number.isFinite(wired.speedRadS)
      ? wired.speedRadS
      : parsed.speedRadS;
  const enabled =
    typeof wired.enabled === "boolean" ? wired.enabled : parsed.enabled;
  const direction = parsed.reverse ? -1 : 1;

  return {
    partPath: parsed.partPath,
    row: {
      axis: parsed.axis,
      speedRadS: speedRaw * direction,
      enabled,
    },
  };
}
