import * as THREE from "three";
import {
  applyUserPreviewTransportToClipActions,
  type GlbPreviewUserTransport,
} from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import type { GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";

function resolveSoloClipName(
  clipActions: ReadonlyMap<string, THREE.AnimationAction>,
  activeClipName: string | null,
): string | null {
  if (activeClipName != null && clipActions.has(activeClipName)) {
    return activeClipName;
  }
  const first = clipActions.keys().next();
  return first.done ? null : first.value;
}

/**
 * Applies manual transport for the animation lab (solo vs parallel-all).
 * When scrubbing, freezes actions at `scrubTimeS` on the solo clip.
 */
/** Phase A legacy mixer path (no trim / fade / sequence advance). */
export function applyAnimationLabLegacyPlayback(args: {
  clipActions: ReadonlyMap<string, THREE.AnimationAction>;
  transport: GlbPreviewUserTransport;
  playbackMode: GlbAnimationLabPlaybackMode;
  activeClipName: string | null;
  isScrubbing: boolean;
  scrubTimeS: number;
}): void {
  const { clipActions, transport, playbackMode, isScrubbing, scrubTimeS } = args;

  const mode = playbackMode;
  const soloMode = mode === "per-clip";
  if (soloMode) {
    const soloName = resolveSoloClipName(clipActions, args.activeClipName);
    for (const [name, ac] of clipActions) {
      if (name !== soloName) {
        ac.enabled = false;
        ac.paused = true;
        ac.weight = 0;
        continue;
      }
      ac.enabled = true;
      ac.weight = 1;
      ac.setLoop(THREE.LoopRepeat, Infinity);
      ac.clampWhenFinished = false;

      if (isScrubbing) {
        ac.paused = true;
        ac.time = Math.max(0, scrubTimeS);
        continue;
      }

      if (transport === "stopped") {
        ac.paused = true;
        ac.time = 0;
        ac.timeScale = 1;
        continue;
      }
      if (transport === "paused") {
        ac.paused = true;
        continue;
      }
      ac.paused = false;
      ac.timeScale = 1;
    }
    return;
  }

  if (mode === "parallel-all") {
    if (isScrubbing) {
      for (const [, ac] of clipActions) {
        ac.enabled = true;
        ac.paused = true;
        ac.time = Math.max(0, scrubTimeS);
        ac.weight = 1;
      }
      return;
    }
    applyUserPreviewTransportToClipActions({ clipActions, transport });
    return;
  }

  if (mode === "sequence") {
    const soloName = resolveSoloClipName(clipActions, args.activeClipName);
    for (const [name, ac] of clipActions) {
      if (name !== soloName) {
        ac.enabled = false;
        ac.paused = true;
        ac.weight = 0;
        continue;
      }
      ac.enabled = true;
      ac.weight = 1;
      if (isScrubbing) {
        ac.paused = true;
        ac.time = Math.max(0, scrubTimeS);
        continue;
      }
      if (transport === "stopped") {
        ac.paused = true;
        ac.time = 0;
        continue;
      }
      if (transport === "paused") {
        ac.paused = true;
        continue;
      }
      ac.paused = false;
    }
    return;
  }

}
