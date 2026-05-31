import type * as THREE from "three";
import type { GlbAnimationClipPreviewDrive } from "./studio-glb-animation-preview-mixer";

/** How the **GLB Animation Bundle** merges clip drives into the preview mixer. */
export type StudioGlbAnimationPlaybackModeV1 = "per-clip" | "parallel-all" | "sequence";

export const STUDIO_ANIMATION_PLAYBACK_MODE_KEY = "animationPlaybackMode" as const;

export const STUDIO_GLB_ANIMATION_PLAYBACK_MODES: readonly StudioGlbAnimationPlaybackModeV1[] = [
  "per-clip",
  "parallel-all",
  "sequence",
] as const;

export function isStudioGlbAnimationPlaybackModeV1(
  value: unknown,
): value is StudioGlbAnimationPlaybackModeV1 {
  return value === "per-clip" || value === "parallel-all" || value === "sequence";
}

export function readStudioGlbAnimationPlaybackMode(
  config: Record<string, unknown> | null | undefined,
): StudioGlbAnimationPlaybackModeV1 {
  if (config == null) {
    return "per-clip";
  }
  const raw = config[STUDIO_ANIMATION_PLAYBACK_MODE_KEY];
  return isStudioGlbAnimationPlaybackModeV1(raw) ? raw : "per-clip";
}

export function playbackModeLabel(mode: StudioGlbAnimationPlaybackModeV1): string {
  switch (mode) {
    case "per-clip":
      return "Per clip (solo)";
    case "parallel-all":
      return "Parallel (all enabled)";
    case "sequence":
      return "Sequence (one after another)";
    default:
      return mode;
  }
}

export type GlbAnimationSequencePlaybackState = {
  activeClipName: string | null;
};

export function resetGlbAnimationSequencePlaybackState(st: GlbAnimationSequencePlaybackState): void {
  st.activeClipName = null;
}

/** Pick the first clip in `clipOrder` that exists in `drives`. */
export function pickInitialSequenceClipName(
  clipOrder: readonly string[],
  drives: Record<string, GlbAnimationClipPreviewDrive>,
): string | null {
  for (const name of clipOrder) {
    if (drives[name] != null) {
      return name;
    }
  }
  return null;
}

/**
 * Sequence mode: drive only the active clip; mixer advances time (`holdTime: false`).
 * Defaults each clip to **once** when loop is unset so the sequence can advance.
 */
export function filterGlbAnimationDrivesForPreview(args: {
  drives: Record<string, GlbAnimationClipPreviewDrive>;
  playbackMode: StudioGlbAnimationPlaybackModeV1;
  clipOrder: readonly string[];
  sequenceState: GlbAnimationSequencePlaybackState;
}): Record<string, GlbAnimationClipPreviewDrive> {
  if (args.playbackMode === "parallel-all") {
    /** Blend-style playback: let the mixer advance time (model-catalog **Blend** mode). */
    const out: Record<string, GlbAnimationClipPreviewDrive> = {};
    for (const [name, src] of Object.entries(args.drives)) {
      out[name] = { ...src, holdTime: false };
    }
    return out;
  }
  if (args.playbackMode !== "sequence") {
    return args.drives;
  }
  const order = args.clipOrder.filter((name) => args.drives[name] != null);
  if (order.length === 0) {
    return {};
  }
  let active = args.sequenceState.activeClipName;
  if (active == null || !order.includes(active) || args.drives[active] == null) {
    active = pickInitialSequenceClipName(order, args.drives);
    args.sequenceState.activeClipName = active;
  }
  if (active == null) {
    return {};
  }
  const src = args.drives[active];
  return {
    [active]: {
      ...src,
      holdTime: false,
      loopMode: src.loopMode ?? "once",
    },
  };
}

/**
 * After `animationMixer.update`, advance sequence when the active **once** clip reaches trim end.
 */
export function advanceGlbAnimationSequenceAfterMixerTick(args: {
  clipActions: ReadonlyMap<string, THREE.AnimationAction>;
  drives: Record<string, GlbAnimationClipPreviewDrive>;
  clipOrder: readonly string[];
  sequenceState: GlbAnimationSequencePlaybackState;
}): void {
  const active = args.sequenceState.activeClipName;
  if (active == null) {
    return;
  }
  const ac = args.clipActions.get(active);
  const drive = args.drives[active];
  if (ac == null || drive == null) {
    return;
  }
  const loopMode = drive.loopMode ?? "once";
  if (loopMode !== "once") {
    return;
  }
  const clipDur = ac.getClip().duration;
  const end = drive.trimEndS >= 0 ? drive.trimEndS : clipDur;
  if (ac.time < end - 1e-3) {
    return;
  }
  const order = args.clipOrder.filter((name) => args.drives[name] != null);
  const idx = order.indexOf(active);
  const next = idx >= 0 && idx + 1 < order.length ? order[idx + 1]! : null;
  args.sequenceState.activeClipName = next;
}
