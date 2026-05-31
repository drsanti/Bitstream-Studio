/** Loop mode mapped to THREE.AnimationAction in the studio GLB preview. */
export type StudioGlbAnimationLoopModeV1 = "once" | "loop" | "pingpong";

export type FlowWireAnimationMarkerV1 = {
  timeS: number;
  label: string;
};

/** Serialized GLB animation bundle on **`glbAnimation`** flow wires (clip-local playback state). */
export type FlowWireAnimationClipV1 = {
  /** Local clip time in seconds. */
  timeS: number;
  /** Mixer time scale (default **1**). */
  speed?: number;
  /** When **false**, the clip is paused and removed from the merged time drive map. */
  enabled?: boolean;
  loopMode?: StudioGlbAnimationLoopModeV1;
  trimStartS?: number;
  trimEndS?: number;
  /** Reserved for future cross-fade / blend authoring (persisted only today). */
  fadeInMs?: number;
  fadeOutMs?: number;
  /** Effective weight in the preview mixer (0–1). */
  weight?: number;
  markers?: FlowWireAnimationMarkerV1[];
  maskPreset?: string;
  followInspectorPlayhead?: boolean;
  restartOnSolo?: boolean;
};

export type FlowWireAnimationV1 = {
  version: 1;
  /** Local GLB clip name → playback state. */
  clips: Record<string, FlowWireAnimationClipV1>;
  /**
   * When set, only this clip name receives merged time/scale drives; others stay paused in the
   * preview (inspector “solo” audition).
   */
  soloClipName?: string | null;
};

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function coerceLoopMode(value: unknown): StudioGlbAnimationLoopModeV1 | undefined {
  if (value === "once" || value === "loop" || value === "pingpong") {
    return value;
  }
  return undefined;
}

function coerceMarkers(value: unknown): FlowWireAnimationMarkerV1[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const out: FlowWireAnimationMarkerV1[] = [];
  for (const row of value) {
    if (row == null || typeof row !== "object" || Array.isArray(row)) {
      continue;
    }
    const o = row as Record<string, unknown>;
    const timeS = asFiniteNumber(o.timeS, NaN);
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!Number.isFinite(timeS) || label.length === 0) {
      continue;
    }
    out.push({ timeS, label });
  }
  return out.length > 0 ? out : undefined;
}

export function defaultFlowWireAnimationV1(): FlowWireAnimationV1 {
  return { version: 1, clips: {} };
}

export function isFlowWireAnimationV1(value: unknown): value is FlowWireAnimationV1 {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return o.version === 1 && o.clips != null && typeof o.clips === "object" && !Array.isArray(o.clips);
}

function coerceClip(raw: unknown): FlowWireAnimationClipV1 {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { timeS: 0, speed: 1, enabled: true };
  }
  const o = raw as Record<string, unknown>;
  const timeS = Math.max(0, asFiniteNumber(o.timeS, 0));
  const speedRaw = o.speed;
  const speed =
    speedRaw === undefined
      ? 1
      : typeof speedRaw === "number" && Number.isFinite(speedRaw)
        ? speedRaw
        : asFiniteNumber(speedRaw, 1);
  const enabled = o.enabled === undefined ? true : asBool(o.enabled, true);
  const base: FlowWireAnimationClipV1 = { timeS, speed, enabled };
  const loopMode = coerceLoopMode(o.loopMode);
  if (loopMode != null) {
    base.loopMode = loopMode;
  }
  const trimStartS = o.trimStartS;
  if (typeof trimStartS === "number" && Number.isFinite(trimStartS) && trimStartS >= 0) {
    base.trimStartS = trimStartS;
  }
  const trimEndS = o.trimEndS;
  if (typeof trimEndS === "number" && Number.isFinite(trimEndS) && trimEndS >= 0) {
    base.trimEndS = trimEndS;
  }
  const fadeInMs = o.fadeInMs;
  if (typeof fadeInMs === "number" && Number.isFinite(fadeInMs) && fadeInMs >= 0) {
    base.fadeInMs = fadeInMs;
  }
  const fadeOutMs = o.fadeOutMs;
  if (typeof fadeOutMs === "number" && Number.isFinite(fadeOutMs) && fadeOutMs >= 0) {
    base.fadeOutMs = fadeOutMs;
  }
  const weight = o.weight;
  if (typeof weight === "number" && Number.isFinite(weight)) {
    base.weight = Math.min(1, Math.max(0, weight));
  }
  const markers = coerceMarkers(o.markers);
  if (markers != null) {
    base.markers = markers;
  }
  const maskPreset = o.maskPreset;
  if (typeof maskPreset === "string" && maskPreset.trim().length > 0) {
    base.maskPreset = maskPreset.trim();
  }
  if (o.followInspectorPlayhead === true) {
    base.followInspectorPlayhead = true;
  }
  if (o.restartOnSolo === true) {
    base.restartOnSolo = true;
  }
  return base;
}

/** Merge a partial clip update into the bundle `clips` map (coerces unknown rows). */
export function mergeGlbBundleClipState(
  clips: Record<string, unknown> | undefined,
  ref: string,
  patch: Partial<FlowWireAnimationClipV1>,
): Record<string, FlowWireAnimationClipV1> {
  const out: Record<string, FlowWireAnimationClipV1> = {};
  const raw = clips ?? {};
  for (const [k, v] of Object.entries(raw)) {
    const name = k.trim();
    if (name.length === 0) {
      continue;
    }
    out[name] = coerceClip(v);
  }
  const prev = out[ref] ?? coerceClip(undefined);
  out[ref] = { ...prev, ...patch };
  return out;
}

export function coerceFlowWireAnimationV1(raw: unknown): FlowWireAnimationV1 {
  const d = defaultFlowWireAnimationV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  const clipsRaw = o.clips;
  if (clipsRaw == null || typeof clipsRaw !== "object" || Array.isArray(clipsRaw)) {
    return d;
  }
  const clips: Record<string, FlowWireAnimationClipV1> = {};
  for (const [k, v] of Object.entries(clipsRaw as Record<string, unknown>)) {
    const name = k.trim();
    if (name.length === 0) {
      continue;
    }
    clips[name] = coerceClip(v);
  }
  const soloRaw = o.soloClipName;
  let soloClipName: string | null = null;
  if (typeof soloRaw === "string" && soloRaw.trim().length > 0) {
    soloClipName = soloRaw.trim();
  } else if (soloRaw === null) {
    soloClipName = null;
  }
  return { version: 1, clips, soloClipName };
}

/** Build a wire from bundle node **`defaultConfig`** (`clips` + optional solo ref). */
export function flowAnimationWireFromBundleDefaultConfig(dc: Record<string, unknown>): FlowWireAnimationV1 {
  const soloRaw = dc.animationSoloClipRef;
  const soloClipName =
    typeof soloRaw === "string" && soloRaw.trim().length > 0 ? soloRaw.trim() : null;
  return coerceFlowWireAnimationV1({
    version: 1,
    clips: dc.clips ?? {},
    soloClipName,
  });
}

/** Resolved trim range for UI + preview (`trimEndS` uses `clipDurationS` when clip omits end). */
export function resolveFlowWireClipTrimRange(
  clip: FlowWireAnimationClipV1,
  clipDurationS: number,
): { trimStartS: number; trimEndS: number } {
  const trimStartS =
    typeof clip.trimStartS === "number" && Number.isFinite(clip.trimStartS) && clip.trimStartS >= 0
      ? clip.trimStartS
      : 0;
  const rawEnd = clip.trimEndS;
  if (typeof rawEnd === "number" && Number.isFinite(rawEnd) && rawEnd >= 0) {
    return { trimStartS, trimEndS: Math.max(trimStartS, rawEnd) };
  }
  if (clipDurationS > 0) {
    return { trimStartS, trimEndS: Math.max(trimStartS, clipDurationS) };
  }
  return { trimStartS, trimEndS: -1 };
}

function clampTrimmedTime(clip: FlowWireAnimationClipV1, clipDurationS = 0): number {
  const { trimStartS, trimEndS } = resolveFlowWireClipTrimRange(clip, clipDurationS);
  const end = trimEndS >= 0 ? trimEndS : Math.max(trimStartS, clipDurationS > 0 ? clipDurationS : clip.timeS);
  return Math.min(end, Math.max(trimStartS, clip.timeS));
}

export type { GlbAnimationClipPreviewDrive } from "../../gltf/studio-glb-animation-preview-mixer";
import type { GlbAnimationClipPreviewDrive } from "../../gltf/studio-glb-animation-preview-mixer";

function clipToPreviewDrive(
  clip: FlowWireAnimationClipV1,
  clipDurationS: number,
): GlbAnimationClipPreviewDrive {
  const { trimStartS, trimEndS } = resolveFlowWireClipTrimRange(clip, clipDurationS);
  const fadeInMs = clip.fadeInMs;
  const fadeOutMs = clip.fadeOutMs;
  return {
    timeS: clampTrimmedTime(clip, clipDurationS),
    speed: typeof clip.speed === "number" && Number.isFinite(clip.speed) ? clip.speed : 1,
    loopMode: clip.loopMode ?? "loop",
    weight: typeof clip.weight === "number" && Number.isFinite(clip.weight) ? Math.min(1, Math.max(0, clip.weight)) : 1,
    trimStartS,
    trimEndS,
    fadeInS: typeof fadeInMs === "number" && fadeInMs > 0 ? fadeInMs / 1000 : 0,
    fadeOutS: typeof fadeOutMs === "number" && fadeOutMs > 0 ? fadeOutMs / 1000 : 0,
    holdTime: true,
  };
}

/**
 * Merge structured animation wire over scalar **`number-constant`** animation drives.
 * - Per clip, the wire **wins** time + speed when **`enabled !== false`**.
 * - When **`enabled === false`**, that clip is **removed** from the merged time map (paused).
 * - When **`soloClipName`** is set on the wire, only that clip is driven.
 */
export function mergeFlowWireAnimationIntoClipDrives(args: {
  scalarTimesByClipName: Record<string, number>;
  wire: FlowWireAnimationV1 | null | undefined;
  /** GLB clip duration by name — improves trim-end when the wire omits `trimEndS`. */
  clipDurationByName?: Record<string, number>;
}): {
  times: Record<string, number>;
  scales: Record<string, number>;
  loops: Record<string, StudioGlbAnimationLoopModeV1>;
  weights: Record<string, number>;
  drives: Record<string, GlbAnimationClipPreviewDrive>;
} {
  const durations = args.clipDurationByName ?? {};
  const drives: Record<string, GlbAnimationClipPreviewDrive> = {};
  const times = { ...args.scalarTimesByClipName };
  const scales: Record<string, number> = {};
  const loops: Record<string, StudioGlbAnimationLoopModeV1> = {};
  const weights: Record<string, number> = {};

  for (const [name, t] of Object.entries(times)) {
    if (typeof t !== "number" || !Number.isFinite(t)) {
      continue;
    }
    const dur = durations[name] ?? 0;
    drives[name] = {
      timeS: Math.max(0, t),
      speed: 1,
      loopMode: "loop",
      weight: 1,
      trimStartS: 0,
      trimEndS: dur > 0 ? dur : -1,
      fadeInS: 0,
      fadeOutS: 0,
      holdTime: true,
    };
  }

  const wire = args.wire;
  if (wire == null) {
    for (const [name, d] of Object.entries(drives)) {
      times[name] = d.timeS;
    }
    return { times, scales, loops, weights, drives };
  }

  const solo = typeof wire.soloClipName === "string" ? wire.soloClipName.trim() : "";
  for (const [name, clip] of Object.entries(wire.clips)) {
    if (name.trim().length === 0) {
      continue;
    }
    if (solo.length > 0 && name !== solo) {
      delete times[name];
      delete drives[name];
      continue;
    }
    if (clip.enabled === false) {
      delete times[name];
      delete drives[name];
      continue;
    }
    const dur = durations[name] ?? 0;
    const drive = clipToPreviewDrive(clip, dur);
    drives[name] = drive;
    times[name] = drive.timeS;
    scales[name] = drive.speed;
    loops[name] = drive.loopMode;
    weights[name] = drive.weight;
  }

  if (solo.length > 0) {
    for (const name of Object.keys(times)) {
      if (name !== solo) {
        delete times[name];
        delete drives[name];
        delete scales[name];
        delete loops[name];
        delete weights[name];
      }
    }
  }

  return { times, scales, loops, weights, drives };
}
