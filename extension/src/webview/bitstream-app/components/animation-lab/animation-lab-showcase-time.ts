import type { GlbPreviewUserTransport } from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";

/** Visitor-friendly duration (e.g. `0:04`, `1:12`). */
export function formatFriendlyDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Animation lab timeline label (e.g. `1234 ms / 2167 ms`). */
export function formatAnimationLabTimelineMs(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${ms.toLocaleString()} ms`;
}

export function formatAnimationLabTimelineRangeMs(positionS: number, durationS: number): string {
  return `${formatAnimationLabTimelineMs(positionS)} / ${formatAnimationLabTimelineMs(durationS)}`;
}

/** Booth timeline (e.g. `0.5 s / 2.1 s`). */
export function formatAnimationLabTimelineSeconds(seconds: number): string {
  const s = Math.max(0, seconds);
  if (s < 10) {
    return `${s.toFixed(1)} s`;
  }
  return `${s.toFixed(0)} s`;
}

export function formatAnimationLabTimelineRangeSeconds(
  positionS: number,
  durationS: number,
): string {
  return `${formatAnimationLabTimelineSeconds(positionS)} / ${formatAnimationLabTimelineSeconds(durationS)}`;
}

/** Inspector playhead: live mixer time while playing; scrub/store otherwise. */
export function resolveAnimationLabTimelineTimeS(args: {
  transport: GlbPreviewUserTransport;
  isScrubbing: boolean;
  scrubTimeS: number;
  liveTimeS: number;
}): number {
  if (args.isScrubbing || args.transport === "stopped") {
    return args.scrubTimeS;
  }
  if (args.transport === "playing") {
    return args.liveTimeS;
  }
  return args.scrubTimeS;
}
