import type {
  FlowWireAnimationV1,
  StudioGlbAnimationLoopModeV1,
} from "../nodes/animation/flow-wire-animation";
import { mergeFlowWireAnimationIntoClipDrives } from "../nodes/animation/flow-wire-animation";
import type { GlbAnimationClipPreviewDrive } from "./studio-glb-animation-preview-mixer";

/** Merged per-clip animation payload for {@link RotationPreviewPanelV4} / mixer drives. */
export type MergedGlbAnimationClipDrives = {
  times: Record<string, number>;
  scales: Record<string, number>;
  loops: Record<string, StudioGlbAnimationLoopModeV1>;
  weights: Record<string, number>;
  drives: Record<string, GlbAnimationClipPreviewDrive>;
};

export type MergeGlbAnimationClipDrivesForPreviewArgs = {
  /** GLB-linked **`number-constant`** animation times (seconds) scoped to the viewer model. */
  scalarTimesByClipName: Record<string, number>;
  /** Structured clip map from **GLB Animation Bundle** on the **`anim`** input. */
  wire: FlowWireAnimationV1 | null | undefined;
  /** One-shot / loop drives from **`event-trigger-glb-anim`** nodes on the same model. */
  eventDrivesByClipName: Record<string, GlbAnimationClipPreviewDrive>;
  /** Optional GLB clip duration by name (improves wire trim-end). */
  clipDurationByName?: Record<string, number>;
};

/**
 * Merge animation sources for **Model Viewer** and **3D Rotation** previews.
 *
 * Per clip name, later layers win:
 * 1. Scalar scrub times (`number-constant` + GLB extract)
 * 2. **Animation bundle** wire (`FlowWireAnimationV1`)
 * 3. **Event trigger** structured drives (`restartNonce`, loop, weight)
 */
export function mergeGlbAnimationClipDrivesForPreview(
  args: MergeGlbAnimationClipDrivesForPreviewArgs,
): MergedGlbAnimationClipDrives {
  const merged = mergeFlowWireAnimationIntoClipDrives({
    scalarTimesByClipName: args.scalarTimesByClipName,
    wire: args.wire,
    clipDurationByName: args.clipDurationByName,
  });

  for (const [clipName, drive] of Object.entries(args.eventDrivesByClipName)) {
    merged.drives[clipName] = drive;
    merged.times[clipName] = drive.timeS;
    merged.scales[clipName] = drive.speed;
    merged.loops[clipName] = drive.loopMode;
    merged.weights[clipName] = drive.weight;
  }

  return merged;
}
