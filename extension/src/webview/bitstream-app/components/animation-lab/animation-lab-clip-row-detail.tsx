import type { ReactNode } from "react";
import {
  formatAnimationLabTimelineSeconds,
  formatFriendlyDuration,
} from "./animation-lab-showcase-time.js";
import type { GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";

export type AnimationLabClipRowDetailArgs = {
  clipName: string;
  displayName: string;
  durationS: number | undefined;
  playbackMode: GlbAnimationLabPlaybackMode;
  tourIndex: number | null;
  tourTotal: number | null;
  selected: boolean;
  isPlayingNow: boolean;
};

function formatClipLengthLine(durationS: number | undefined): string | null {
  if (durationS == null || !Number.isFinite(durationS) || durationS <= 0) {
    return null;
  }
  return `${formatAnimationLabTimelineSeconds(durationS)} (${formatFriendlyDuration(durationS)})`;
}

/** One-line summary under the clip title in the list row. */
export function formatAnimationLabClipRowSubline(args: AnimationLabClipRowDetailArgs): string | null {
  const parts: string[] = [];
  const length = formatClipLengthLine(args.durationS);
  if (length != null) {
    parts.push(length);
  }
  if (
    args.playbackMode === "sequence" &&
    args.tourIndex != null &&
    args.tourTotal != null &&
    args.tourTotal > 0
  ) {
    parts.push(`Tour ${args.tourIndex + 1}/${args.tourTotal}`);
  }
  if (args.isPlayingNow) {
    parts.push("Now playing");
  } else if (args.selected && args.playbackMode === "per-clip") {
    parts.push("Selected");
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Rich hover panel for a clip row (TRNButton `hint`). */
export function AnimationLabClipRowHintContent(args: AnimationLabClipRowDetailArgs): ReactNode {
  const length = formatClipLengthLine(args.durationS);
  const tourLine =
    args.playbackMode === "sequence" &&
    args.tourIndex != null &&
    args.tourTotal != null &&
    args.tourTotal > 0
      ? `${args.tourIndex + 1} of ${args.tourTotal}${
          args.tourIndex === 0 ? " (plays first)" : ""
        }`
      : null;

  let status: string | null = null;
  if (args.isPlayingNow) {
    status = "Now playing";
  } else if (args.selected) {
    status =
      args.playbackMode === "per-clip"
        ? "Selected — press Play to preview"
        : args.playbackMode === "sequence"
          ? "Selected"
          : "Selected";
  }

  return (
    <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-zinc-200">
      <div>
        <div className="text-xs font-semibold text-zinc-50">{args.displayName}</div>
        {args.displayName !== args.clipName ? (
          <div className="mt-0.5 text-zinc-400">GLB clip: {args.clipName}</div>
        ) : (
          <div className="mt-0.5 text-zinc-500">GLB animation clip</div>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        {length != null ? (
          <>
            <dt className="text-zinc-500">Length</dt>
            <dd className="text-zinc-100">{length}</dd>
          </>
        ) : null}
        {tourLine != null ? (
          <>
            <dt className="text-zinc-500">Tour</dt>
            <dd className="text-zinc-100">{tourLine}</dd>
          </>
        ) : null}
        {status != null ? (
          <>
            <dt className="text-zinc-500">Status</dt>
            <dd className={args.isPlayingNow ? "text-emerald-300/95" : "text-cyan-200/90"}>
              {status}
            </dd>
          </>
        ) : null}
      </dl>
      <p className="text-zinc-500">Tap to select this clip.</p>
    </div>
  );
}
