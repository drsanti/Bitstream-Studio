import * as THREE from "three";
import type { GlbAnimationClipPreviewDrive } from "./studio-glb-animation-preview-mixer";

export type GlbPreviewUserTransport = "stopped" | "playing" | "paused";

/** Flow wires / inspector drives own the mixer — manual transport is disabled. */
export function flowOwnsGlbPreviewAnimation(args: {
  structuredDrives: Record<string, GlbAnimationClipPreviewDrive>;
  legacyTimesByClip: Record<string, number>;
}): boolean {
  if (Object.keys(args.structuredDrives).length > 0) {
    return true;
  }
  return Object.values(args.legacyTimesByClip).some(
    (t) => typeof t === "number" && Number.isFinite(t),
  );
}

/** Manual play/pause/stop when no flow animation drives are active. */
export function applyUserPreviewTransportToClipActions(args: {
  clipActions: ReadonlyMap<string, THREE.AnimationAction>;
  transport: GlbPreviewUserTransport;
}): void {
  for (const [, ac] of args.clipActions) {
    if (args.transport === "stopped") {
      ac.enabled = true;
      ac.paused = true;
      ac.time = 0;
      ac.timeScale = 1;
      ac.weight = 1;
      ac.setLoop(THREE.LoopRepeat, Infinity);
      ac.clampWhenFinished = false;
      continue;
    }
    if (args.transport === "paused") {
      ac.paused = true;
      continue;
    }
    ac.enabled = true;
    ac.paused = false;
    ac.timeScale = 1;
    ac.weight = 1;
    ac.setLoop(THREE.LoopRepeat, Infinity);
    ac.clampWhenFinished = false;
  }
}
