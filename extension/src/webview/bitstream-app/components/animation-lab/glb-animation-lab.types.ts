import type { GlbPreviewUserTransport } from "../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import type { StudioGlbAnimationLoopModeV1 } from "../../../sensor-studio/features/editor/nodes/animation/flow-wire-animation.js";
import type { StudioGlbAnimationPlaybackModeV1 } from "../../../sensor-studio/features/editor/gltf/studio-glb-animation-playback-mode.js";
import type { AnimationLabCatalogHints } from "./animation-lab-catalog-hints.js";
import type { GlbClipOverlapReport } from "./analyze-glb-clip-overlap.js";

/** Aligns with Studio {@link StudioGlbAnimationPlaybackModeV1}; `per-clip` replaces Phase A `solo`. */
export type GlbAnimationLabPlaybackMode = StudioGlbAnimationPlaybackModeV1;

export type GlbAnimationLabMixerEngine = "studio" | "legacy";

export type GlbAnimationLabClipSettings = {
  weight: number;
  loopMode: StudioGlbAnimationLoopModeV1;
  trimStartS: number;
  /** Negative = use full GLTF clip duration. */
  trimEndS: number;
  fadeInS: number;
  fadeOutS: number;
  speed: number;
};

export const DEFAULT_ANIMATION_LAB_CLIP_SETTINGS: GlbAnimationLabClipSettings = {
  weight: 1,
  loopMode: "loop",
  trimStartS: 0,
  trimEndS: -1,
  fadeInS: 0.15,
  fadeOutS: 0.15,
  speed: 1,
};

export type { AnimationLabCatalogHints, GlbClipOverlapReport };

export type GlbAnimationLabLivePlayback = {
  timeS: number;
  frame: number;
  fps: number;
  clipName: string | null;
};

export const EMPTY_GLB_ANIMATION_LAB_LIVE_PLAYBACK: GlbAnimationLabLivePlayback = {
  timeS: 0,
  frame: 0,
  fps: 30,
  clipName: null,
};

export type GlbAnimationLabRuntimeReport = {
  gltfClipCount: number;
  clipNames: string[];
  boundActionCount: number;
  maxClipDurationS: number;
  clipDurationByName: Record<string, number>;
  overlap: GlbClipOverlapReport | null;
  catalogHints: AnimationLabCatalogHints | null;
};

export const EMPTY_GLB_ANIMATION_LAB_RUNTIME: GlbAnimationLabRuntimeReport = {
  gltfClipCount: 0,
  clipNames: [],
  boundActionCount: 0,
  maxClipDurationS: 0,
  clipDurationByName: {},
  overlap: null,
  catalogHints: null,
};

export type GlbAnimationLabContextValue = {
  fetchUrl: string;
  modelLabel: string;
  dedupeKey: string;
  mixerEngine: GlbAnimationLabMixerEngine;
  setMixerEngine: (engine: GlbAnimationLabMixerEngine) => void;
  playbackMode: GlbAnimationLabPlaybackMode;
  setPlaybackMode: (mode: GlbAnimationLabPlaybackMode) => void;
  clipOrder: string[];
  moveClipInOrder: (name: string, direction: "up" | "down") => void;
  activeClipName: string | null;
  setActiveClipName: (name: string | null) => void;
  clipSettings: Record<string, GlbAnimationLabClipSettings>;
  updateClipSettings: (name: string, patch: Partial<GlbAnimationLabClipSettings>) => void;
  soloCrossFadeS: number;
  setSoloCrossFadeS: (seconds: number) => void;
  transport: GlbPreviewUserTransport;
  setTransport: (t: GlbPreviewUserTransport) => void;
  isScrubbing: boolean;
  setIsScrubbing: (scrubbing: boolean) => void;
  scrubTimeS: number;
  setScrubTimeS: (t: number) => void;
  runtime: GlbAnimationLabRuntimeReport;
  setRuntimeReport: (report: GlbAnimationLabRuntimeReport) => void;
  activeClipRestartNonce: number;
  livePlayback: GlbAnimationLabLivePlayback;
  catalogHintsApplied: AnimationLabCatalogHints | null;
};
