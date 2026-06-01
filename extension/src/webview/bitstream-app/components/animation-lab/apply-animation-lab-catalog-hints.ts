import type { AnimationLabCatalogHints } from "./animation-lab-catalog-hints.js";
import type { GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";

export type ApplyAnimationLabCatalogHintsArgs = {
  hints: AnimationLabCatalogHints;
  clipNames: readonly string[];
  setPlaybackMode: (mode: GlbAnimationLabPlaybackMode) => void;
  setActiveClipName: (name: string | null) => void;
  setClipOrder: (order: string[]) => void;
};

/**
 * Applies normalized catalog metadata after a GLB loads (does not start transport).
 */
export function applyAnimationLabCatalogHints(args: ApplyAnimationLabCatalogHintsArgs): void {
  const { hints, clipNames, setPlaybackMode, setActiveClipName, setClipOrder } = args;

  if (hints.recommendedPlaybackMode != null) {
    setPlaybackMode(hints.recommendedPlaybackMode);
  }

  if (hints.clipOrder != null && hints.clipOrder.length > 0) {
    const merged = [
      ...hints.clipOrder.filter((n) => clipNames.includes(n)),
      ...clipNames.filter((n) => !hints.clipOrder!.includes(n)),
    ];
    setClipOrder(merged);
  }

  if (hints.defaultPreviewClip != null && clipNames.includes(hints.defaultPreviewClip)) {
    setActiveClipName(hints.defaultPreviewClip);
  }
}
