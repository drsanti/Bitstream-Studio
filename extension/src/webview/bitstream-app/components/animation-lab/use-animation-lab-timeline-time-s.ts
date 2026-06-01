import { useSyncExternalStore } from "react";
import type { GlbPreviewUserTransport } from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import { resolveAnimationLabTimelineTimeS } from "./animation-lab-showcase-time.js";
import {
  getAnimationLabTimelineSnapshot,
  subscribeAnimationLabTimeline,
} from "./animation-lab-timeline-store.js";

export function useAnimationLabTimelinePositionS(args: {
  transport: GlbPreviewUserTransport;
  isScrubbing: boolean;
  scrubTimeS: number;
}): number {
  const live = useSyncExternalStore(
    subscribeAnimationLabTimeline,
    getAnimationLabTimelineSnapshot,
    getAnimationLabTimelineSnapshot,
  );

  return resolveAnimationLabTimelineTimeS({
    transport: args.transport,
    isScrubbing: args.isScrubbing,
    scrubTimeS: args.scrubTimeS,
    liveTimeS: live.timeS,
  });
}
