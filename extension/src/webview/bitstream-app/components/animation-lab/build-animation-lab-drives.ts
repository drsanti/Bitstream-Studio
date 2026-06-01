import type { GlbAnimationClipPreviewDrive } from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-preview-mixer.js";
import type { GlbPreviewUserTransport } from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import { resolveAnimationLabActionKey } from "./animation-lab-action-key.js";
import {
  DEFAULT_ANIMATION_LAB_CLIP_SETTINGS,
  type GlbAnimationLabClipSettings,
  type GlbAnimationLabPlaybackMode,
} from "./glb-animation-lab.types.js";

export type BuildAnimationLabDrivesArgs = {
  clipNames: readonly string[];
  playbackMode: GlbAnimationLabPlaybackMode;
  activeClipName: string | null;
  clipSettings: Readonly<Record<string, GlbAnimationLabClipSettings>>;
  transport: GlbPreviewUserTransport;
  isScrubbing: boolean;
  scrubTimeS: number;
  soloCrossFadeS: number;
  activeClipRestartNonce: number;
};

function settingsFor(
  clipSettings: Readonly<Record<string, GlbAnimationLabClipSettings>>,
  name: string,
): GlbAnimationLabClipSettings {
  return clipSettings[name] ?? DEFAULT_ANIMATION_LAB_CLIP_SETTINGS;
}

function holdTimeForTransport(
  transport: GlbPreviewUserTransport,
  isScrubbing: boolean,
): boolean {
  return isScrubbing || transport === "stopped" || transport === "paused";
}

function timeSForClip(
  transport: GlbPreviewUserTransport,
  isScrubbing: boolean,
  scrubTimeS: number,
  settings: GlbAnimationLabClipSettings,
): number {
  if (transport === "stopped" && !isScrubbing) {
    return settings.trimStartS;
  }
  return Math.max(settings.trimStartS, scrubTimeS);
}

function toDrive(
  settings: GlbAnimationLabClipSettings,
  args: {
    transport: GlbPreviewUserTransport;
    isScrubbing: boolean;
    scrubTimeS: number;
    restartNonce?: number;
    fadeInOverride?: number;
  },
): GlbAnimationClipPreviewDrive {
  const holdTime = holdTimeForTransport(args.transport, args.isScrubbing);
  return {
    timeS: timeSForClip(args.transport, args.isScrubbing, args.scrubTimeS, settings),
    speed: settings.speed,
    loopMode: settings.loopMode,
    weight: settings.weight,
    trimStartS: settings.trimStartS,
    trimEndS: settings.trimEndS,
    fadeInS: args.fadeInOverride ?? settings.fadeInS,
    fadeOutS: settings.fadeOutS,
    restartNonce: args.restartNonce,
    holdTime,
  };
}

/**
 * Builds Studio {@link GlbAnimationClipPreviewDrive} map for the animation lab inspector.
 */
export function buildAnimationLabDrives(
  args: BuildAnimationLabDrivesArgs,
): Record<string, GlbAnimationClipPreviewDrive> {
  const { clipNames, playbackMode, activeClipName, clipSettings, transport, isScrubbing, scrubTimeS, soloCrossFadeS, activeClipRestartNonce } = args;

  if (clipNames.length === 0) {
    return {};
  }

  if (playbackMode === "parallel-all") {
    const out: Record<string, GlbAnimationClipPreviewDrive> = {};
    for (const name of clipNames) {
      out[name] = toDrive(settingsFor(clipSettings, name), {
        transport,
        isScrubbing,
        scrubTimeS,
      });
    }
    return out;
  }

  if (playbackMode === "sequence") {
    const out: Record<string, GlbAnimationClipPreviewDrive> = {};
    for (const name of clipNames) {
      const s = settingsFor(clipSettings, name);
      out[name] = toDrive(
        { ...s, loopMode: s.loopMode === "loop" ? "once" : s.loopMode },
        { transport, isScrubbing, scrubTimeS },
      );
    }
    return out;
  }

  const solo =
    resolveAnimationLabActionKey(clipNames, activeClipName) ??
    clipNames[0]!;
  const s = settingsFor(clipSettings, solo);
  return {
    [solo]: toDrive(s, {
      transport,
      isScrubbing,
      scrubTimeS,
      restartNonce: activeClipRestartNonce,
      fadeInOverride: soloCrossFadeS,
    }),
  };
}
