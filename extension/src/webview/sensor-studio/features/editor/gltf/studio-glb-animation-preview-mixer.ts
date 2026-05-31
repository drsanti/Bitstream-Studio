import * as THREE from "three";
import type { StudioGlbAnimationLoopModeV1 } from "../nodes/animation/flow-wire-animation";

/** Per-clip payload consumed by {@link applyStudioGlbAnimationMixerDrives}. */
export type GlbAnimationClipPreviewDrive = {
  timeS: number;
  speed: number;
  loopMode: StudioGlbAnimationLoopModeV1;
  weight: number;
  trimStartS: number;
  /** When negative, preview uses the GLTF clip duration at runtime. */
  trimEndS: number;
  fadeInS: number;
  fadeOutS: number;
  /**
   * When this value changes, the preview restarts the clip from `timeS` (event one-shot triggers).
   * Omit for scrub / inspector drives that only move `timeS`.
   */
  restartNonce?: number;
  /**
   * When **true** (default), every frame sets `action.time` from `timeS` (scrub).
   * When **false**, the mixer advances time after the initial restart.
   */
  holdTime?: boolean;
};

/** Per-clip mixer bookkeeping across frames (lives in the preview render loop closure). */
export type StudioGlbAnimationMixerState = {
  prevActive: Set<string>;
  /** Last drive payload per clip (used for fade-out duration when a clip deactivates). */
  lastDrives: Record<string, GlbAnimationClipPreviewDrive>;
  /** Last seen {@link GlbAnimationClipPreviewDrive.restartNonce} per clip. */
  lastRestartNonceByClip: Record<string, number>;
  /** Avoid calling {@link THREE.AnimationAction.setLoop} every frame (can stutter). */
  lastLoopModeByClip: Record<string, GlbAnimationClipPreviewDrive["loopMode"]>;
};

export function createStudioGlbAnimationMixerState(): StudioGlbAnimationMixerState {
  return { prevActive: new Set(), lastDrives: {}, lastRestartNonceByClip: {}, lastLoopModeByClip: {} };
}

function resolveTrimRange(
  drive: GlbAnimationClipPreviewDrive,
  clipDurationS: number,
): { start: number; end: number } {
  const start = Math.max(0, drive.trimStartS);
  const end =
    drive.trimEndS >= 0 && Number.isFinite(drive.trimEndS)
      ? Math.max(start, drive.trimEndS)
      : Math.max(start, clipDurationS);
  return { start, end };
}

function clampTimeToTrim(timeS: number, start: number, end: number): number {
  return Math.min(end, Math.max(start, timeS));
}

function applyLoopMode(ac: THREE.AnimationAction, mode: GlbAnimationClipPreviewDrive["loopMode"]): void {
  const threeLoop =
    mode === "once"
      ? THREE.LoopOnce
      : mode === "pingpong"
        ? THREE.LoopPingPong
        : THREE.LoopRepeat;
  const reps = mode === "once" ? 1 : Infinity;
  ac.setLoop(threeLoop, reps);
  ac.clampWhenFinished = mode === "once";
}

/**
 * Apply structured per-clip drives to a loaded GLTF mixer (trim, weight, loop, fade in/out).
 * Returns the set of clip names that are actively driven this frame.
 */
export function applyStudioGlbAnimationMixerDrives(args: {
  clipActions: ReadonlyMap<string, THREE.AnimationAction>;
  drives: Record<string, GlbAnimationClipPreviewDrive>;
  state: StudioGlbAnimationMixerState;
}): Set<string> {
  const { clipActions, drives, state } = args;
  const nextActive = new Set<string>();

  for (const [nm, ac] of clipActions) {
    const drive = drives[nm];
    if (drive != null) {
      nextActive.add(nm);
    }
  }

  for (const nm of state.prevActive) {
    if (nextActive.has(nm)) {
      continue;
    }
    const ac = clipActions.get(nm);
    if (ac == null) {
      continue;
    }
    const last = state.lastDrives[nm];
    const fadeOutS = last?.fadeOutS ?? 0;
    if (fadeOutS > 1e-6) {
      ac.fadeOut(fadeOutS);
    } else {
      ac.stop();
      ac.enabled = false;
      ac.setEffectiveWeight(0);
    }
  }

  for (const [nm, ac] of clipActions) {
    const drive = drives[nm];
    if (drive == null) {
      if (!state.prevActive.has(nm)) {
        ac.stop();
        ac.enabled = false;
        ac.setEffectiveWeight(0);
      }
      continue;
    }

    const clipDur = ac.getClip().duration;
    const { start, end } = resolveTrimRange(drive, clipDur);
    const timeS = clampTimeToTrim(drive.timeS, start, end);
    const restartNonce = drive.restartNonce ?? 0;
    const prevRestartNonce = state.lastRestartNonceByClip[nm] ?? -1;
    const forceRestart = restartNonce !== prevRestartNonce;
    if (forceRestart) {
      state.lastRestartNonceByClip[nm] = restartNonce;
    }
    const wasActive = state.prevActive.has(nm) && !forceRestart;
    const holdTime = drive.holdTime !== false;
    const targetWeight = Math.min(1, Math.max(0, drive.weight));
    const speed =
      typeof drive.speed === "number" && Number.isFinite(drive.speed) && Math.abs(drive.speed) < 1e6
        ? drive.speed
        : 1;

    ac.enabled = true;
    ac.timeScale = speed;
    const prevLoop = state.lastLoopModeByClip[nm];
    if (prevLoop !== drive.loopMode) {
      applyLoopMode(ac, drive.loopMode);
      state.lastLoopModeByClip[nm] = drive.loopMode;
    }

    if (holdTime) {
      /** Scrub / inspector playhead — pin time; do not let mixer.update advance this action. */
      if (!wasActive) {
        ac.reset();
        ac.play();
        if (drive.fadeInS > 1e-6) {
          ac.setEffectiveWeight(0);
          ac.fadeIn(drive.fadeInS);
        } else {
          ac.setEffectiveWeight(targetWeight);
        }
      } else {
        ac.setEffectiveWeight(targetWeight);
      }
      ac.time = timeS;
      ac.paused = true;
    } else {
      if (!wasActive || forceRestart) {
        ac.time = timeS;
      }
      if (!wasActive) {
        ac.reset();
        ac.time = timeS;
        ac.play();
        if (drive.fadeInS > 1e-6) {
          ac.setEffectiveWeight(0);
          ac.fadeIn(drive.fadeInS);
        } else {
          ac.setEffectiveWeight(targetWeight);
        }
      } else {
        ac.paused = false;
        ac.setEffectiveWeight(targetWeight);
      }
    }
  }

  state.prevActive = nextActive;
  state.lastDrives = { ...drives };
  return nextActive;
}
