import { create } from "zustand";
import {
  readStudioGlbAnimationPlaybackMode,
  type StudioGlbAnimationPlaybackModeV1,
} from "../../../../gltf/studio-glb-animation-playback-mode";

/** Persisted on `glb-animation-bundle` defaultConfig — survives re-select and flow save. */
export const ANIMATION_INSPECTOR_BLEND_PLAYING_KEY = "animationInspectorBlendPlaying" as const;
export const ANIMATION_INSPECTOR_PLAYING_REFS_KEY = "animationInspectorPlayingRefs" as const;
export const ANIMATION_INSPECTOR_SEQUENCE_ACTIVE_REF_KEY =
  "animationInspectorSequenceActiveRef" as const;
export const ANIMATION_INSPECTOR_EXPANDED_CLIP_INDEX_KEY =
  "animationInspectorExpandedClipIndex" as const;
export const ANIMATION_INSPECTOR_EXPANDED_CLIP_INDICES_KEY =
  "animationInspectorExpandedClipIndices" as const;

export type GlbBundleInspectorSession = {
  playingRefs: readonly string[];
  blendPlaying: boolean;
  sequenceActiveRef: string | null;
  expandedClipIndices: readonly number[];
};

export const EMPTY_GLB_BUNDLE_INSPECTOR_SESSION: GlbBundleInspectorSession = {
  playingRefs: [],
  blendPlaying: false,
  sequenceActiveRef: null,
  expandedClipIndices: [0],
};

function readExpandedClipIndicesFromConfig(
  dc: Record<string, unknown>,
): readonly number[] {
  const indicesRaw = dc[ANIMATION_INSPECTOR_EXPANDED_CLIP_INDICES_KEY];
  if (Array.isArray(indicesRaw)) {
    const indices = indicesRaw
      .filter((x): x is number => typeof x === "number" && Number.isFinite(x))
      .map((x) => Math.round(x));
    if (indices.length > 0) {
      return [...new Set(indices)].sort((a, b) => a - b);
    }
  }
  const legacyRaw = dc[ANIMATION_INSPECTOR_EXPANDED_CLIP_INDEX_KEY];
  if (typeof legacyRaw === "number" && Number.isFinite(legacyRaw)) {
    return [Math.round(legacyRaw)];
  }
  return [...EMPTY_GLB_BUNDLE_INSPECTOR_SESSION.expandedClipIndices];
}

export function readGlbBundleInspectorSessionFromConfig(
  dc: Record<string, unknown> | undefined,
): GlbBundleInspectorSession {
  if (dc == null) {
    return { ...EMPTY_GLB_BUNDLE_INSPECTOR_SESSION };
  }
  const playingRaw = dc[ANIMATION_INSPECTOR_PLAYING_REFS_KEY];
  const playingRefs = Array.isArray(playingRaw)
    ? playingRaw.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const blendPlaying = dc[ANIMATION_INSPECTOR_BLEND_PLAYING_KEY] === true;
  const seqRaw = dc[ANIMATION_INSPECTOR_SEQUENCE_ACTIVE_REF_KEY];
  const sequenceActiveRef =
    typeof seqRaw === "string" && seqRaw.trim().length > 0 ? seqRaw.trim() : null;
  const expandedClipIndices = readExpandedClipIndicesFromConfig(dc);
  return {
    playingRefs,
    blendPlaying,
    sequenceActiveRef,
    expandedClipIndices,
  };
}

/** True when inspector Play is active for the current playback mode. */
export function isGlbBundleInspectorTransportActive(
  dc: Record<string, unknown> | undefined,
  playbackMode?: StudioGlbAnimationPlaybackModeV1,
): boolean {
  const mode = playbackMode ?? readStudioGlbAnimationPlaybackMode(dc);
  const session = readGlbBundleInspectorSessionFromConfig(dc);
  if (mode === "per-clip") {
    return session.playingRefs.length > 0;
  }
  return session.blendPlaying;
}

export function glbBundleInspectorSessionConfigPatch(
  session: GlbBundleInspectorSession,
): Record<string, unknown> {
  return {
    [ANIMATION_INSPECTOR_BLEND_PLAYING_KEY]: session.blendPlaying,
    [ANIMATION_INSPECTOR_PLAYING_REFS_KEY]: [...session.playingRefs],
    [ANIMATION_INSPECTOR_SEQUENCE_ACTIVE_REF_KEY]: session.sequenceActiveRef,
    [ANIMATION_INSPECTOR_EXPANDED_CLIP_INDICES_KEY]: [...session.expandedClipIndices],
  };
}

type GlbBundleInspectorSessionStore = {
  byNodeId: Record<string, GlbBundleInspectorSession>;
  ensureHydrated: (nodeId: string, dc: Record<string, unknown> | undefined) => void;
  patchSession: (nodeId: string, patch: Partial<GlbBundleInspectorSession>) => GlbBundleInspectorSession;
  getSession: (nodeId: string) => GlbBundleInspectorSession;
  clearSession: (nodeId: string) => void;
};

export const useGlbBundleInspectorSessionStore = create<GlbBundleInspectorSessionStore>((set, get) => ({
  byNodeId: {},
  ensureHydrated: (nodeId, dc) => {
    if (get().byNodeId[nodeId] != null) {
      return;
    }
    set((state) => ({
      byNodeId: {
        ...state.byNodeId,
        [nodeId]: readGlbBundleInspectorSessionFromConfig(dc),
      },
    }));
  },
  patchSession: (nodeId, patch) => {
    const prev = get().byNodeId[nodeId] ?? { ...EMPTY_GLB_BUNDLE_INSPECTOR_SESSION };
    const next: GlbBundleInspectorSession = {
      playingRefs: patch.playingRefs ?? prev.playingRefs,
      blendPlaying: patch.blendPlaying ?? prev.blendPlaying,
      sequenceActiveRef:
        patch.sequenceActiveRef !== undefined ? patch.sequenceActiveRef : prev.sequenceActiveRef,
      expandedClipIndices:
        patch.expandedClipIndices !== undefined
          ? [...patch.expandedClipIndices]
          : prev.expandedClipIndices,
    };
    set((state) => ({
      byNodeId: { ...state.byNodeId, [nodeId]: next },
    }));
    return next;
  },
  getSession: (nodeId) => get().byNodeId[nodeId] ?? EMPTY_GLB_BUNDLE_INSPECTOR_SESSION,
  clearSession: (nodeId) => {
    set((state) => {
      const next = { ...state.byNodeId };
      delete next[nodeId];
      return { byNodeId: next };
    });
  },
}));
