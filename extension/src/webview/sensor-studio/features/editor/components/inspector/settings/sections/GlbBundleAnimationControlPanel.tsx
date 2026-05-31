import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimationBlendMode, AnimationClipLoop } from "../../../../../../../model-catalog/persisted-settings";
import { PreviewAnimationCard } from "../../../../../../../model-catalog/components/PreviewAnimationCard";
import { TRNHintText, TRNInlineToggleRow } from "../../../../../../../ui/TRN";
import {
  mergeGlbBundleClipState,
  resolveFlowWireClipTrimRange,
  type FlowWireAnimationClipV1,
  type StudioGlbAnimationLoopModeV1,
} from "../../../../nodes/animation/flow-wire-animation";
import {
  STUDIO_ANIMATION_PLAYBACK_MODE_KEY,
  type StudioGlbAnimationPlaybackModeV1,
} from "../../../../gltf/studio-glb-animation-playback-mode";

const ANIMATION_SOLO_CLIP_REF_KEY = "animationSoloClipRef" as const;
const ANIMATION_BLEND_COMPACT_VIEW_KEY = "animationBlendCompactView" as const;
const ANIMATION_CROSSFADE_S_KEY = "animationCrossfadeS" as const;

function toCatalogLoop(loop: StudioGlbAnimationLoopModeV1 | undefined): AnimationClipLoop {
  if (loop === "once") {
    return "once";
  }
  return "loop";
}

function fromCatalogLoop(loop: AnimationClipLoop): StudioGlbAnimationLoopModeV1 {
  if (loop === "once") {
    return "once";
  }
  return "loop";
}

function normalizedPlayhead(clip: FlowWireAnimationClipV1, durationS: number): number {
  const { trimStartS, trimEndS } = resolveFlowWireClipTrimRange(clip, durationS);
  const span = Math.max(1e-6, trimEndS - trimStartS);
  return Math.min(1, Math.max(0, (clip.timeS - trimStartS) / span));
}

function timeFromNormalizedPlayhead(
  normalized: number,
  clip: FlowWireAnimationClipV1,
  durationS: number,
): number {
  const { trimStartS, trimEndS } = resolveFlowWireClipTrimRange(clip, durationS);
  const span = Math.max(0, trimEndS - trimStartS);
  return trimStartS + Math.min(1, Math.max(0, normalized)) * span;
}

function readClipMap(dc: Record<string, unknown> | undefined): Record<string, unknown> {
  const raw = dc?.clips;
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export type GlbBundleAnimationControlPanelProps = {
  clipIdsOrdered: readonly string[];
  clipMap: Record<string, unknown>;
  defaultConfig: Record<string, unknown> | undefined;
  durationByRef: ReadonlyMap<string, number>;
  labelByRef: ReadonlyMap<string, string>;
  playbackMode: StudioGlbAnimationPlaybackModeV1;
  soloClipRef: string;
  playingRefs: readonly string[];
  onUpdateConfigField: (key: string, value: unknown) => void;
  onCommitClipPatch: (ref: string, patch: Partial<FlowWireAnimationClipV1>) => void;
  onLiveClipPatch: (ref: string, patch: Partial<FlowWireAnimationClipV1>) => void;
  onSetPlayingRefs: (refs: readonly string[]) => void;
};

export function GlbBundleAnimationControlPanel(props: GlbBundleAnimationControlPanelProps) {
  const {
    clipIdsOrdered,
    clipMap,
    defaultConfig,
    durationByRef,
    labelByRef,
    playbackMode,
    soloClipRef,
    playingRefs,
    onUpdateConfigField,
    onCommitClipPatch,
    onLiveClipPatch,
    onSetPlayingRefs,
  } = props;

  const sequenceMode = playbackMode === "sequence";
  const catalogBlendMode: AnimationBlendMode =
    playbackMode === "parallel-all" || sequenceMode ? "blend" : "single";

  const compactRaw = defaultConfig?.[ANIMATION_BLEND_COMPACT_VIEW_KEY];
  const blendCompactView = compactRaw !== false;

  const crossfadeRaw = defaultConfig?.[ANIMATION_CROSSFADE_S_KEY];
  const crossfadeDuration =
    typeof crossfadeRaw === "number" && Number.isFinite(crossfadeRaw) && crossfadeRaw >= 0
      ? crossfadeRaw
      : 0.3;

  const clipNames = useMemo(
    () => clipIdsOrdered.map((ref) => labelByRef.get(ref) ?? ref),
    [clipIdsOrdered, labelByRef],
  );

  const clipDurations = useMemo(
    () => clipIdsOrdered.map((ref) => durationByRef.get(ref) ?? 0),
    [clipIdsOrdered, durationByRef],
  );

  const clipStates = useMemo(
    () =>
      clipIdsOrdered.map((ref) => mergeGlbBundleClipState(clipMap, ref, {})[ref]!),
    [clipIdsOrdered, clipMap],
  );

  const clipWeights = useMemo(
    () => clipStates.map((c) => (typeof c.weight === "number" && Number.isFinite(c.weight) ? c.weight : 1)),
    [clipStates],
  );

  const clipSpeeds = useMemo(
    () => clipStates.map((c) => (typeof c.speed === "number" && Number.isFinite(c.speed) ? c.speed : 1)),
    [clipStates],
  );

  const clipLoops = useMemo(
    () => clipStates.map((c) => toCatalogLoop(c.loopMode)),
    [clipStates],
  );

  const clipScrubTimes = useMemo(
    () =>
      clipIdsOrdered.map((ref, i) => {
        const dur = clipDurations[i] ?? 0;
        return normalizedPlayhead(clipStates[i]!, dur);
      }),
    [clipIdsOrdered, clipDurations, clipStates],
  );

  const currentClipIndex = useMemo(() => {
    if (soloClipRef.length > 0) {
      const idx = clipIdsOrdered.indexOf(soloClipRef);
      if (idx >= 0) {
        return idx;
      }
    }
    return 0;
  }, [soloClipRef, clipIdsOrdered]);

  const singleScrubTime = clipScrubTimes[currentClipIndex] ?? 0;

  const [blendPlaying, setBlendPlaying] = useState(false);
  const isPlaying = catalogBlendMode === "single" ? playingRefs.length > 0 : blendPlaying;

  const lastNonSequenceRef = useRef<"per-clip" | "parallel-all">("parallel-all");
  useEffect(() => {
    if (playbackMode === "per-clip" || playbackMode === "parallel-all") {
      lastNonSequenceRef.current = playbackMode;
    }
  }, [playbackMode]);

  const patchClipAtIndex = useCallback(
    (index: number, patch: Partial<FlowWireAnimationClipV1>, live = false) => {
      const ref = clipIdsOrdered[index];
      if (ref == null) {
        return;
      }
      if (live) {
        onLiveClipPatch(ref, { ...patch, enabled: patch.enabled ?? true });
      } else {
        onCommitClipPatch(ref, { ...patch, enabled: patch.enabled ?? true });
      }
    },
    [clipIdsOrdered, onCommitClipPatch, onLiveClipPatch],
  );

  const onBlendModeChange = useCallback(
    (mode: AnimationBlendMode) => {
      void onUpdateConfigField(
        STUDIO_ANIMATION_PLAYBACK_MODE_KEY,
        mode === "blend" ? "parallel-all" : "per-clip",
      );
    },
    [onUpdateConfigField],
  );

  const onSequenceToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        void onUpdateConfigField(STUDIO_ANIMATION_PLAYBACK_MODE_KEY, "sequence");
        return;
      }
      void onUpdateConfigField(STUDIO_ANIMATION_PLAYBACK_MODE_KEY, lastNonSequenceRef.current);
    },
    [onUpdateConfigField],
  );

  const onClipChange = useCallback(
    (index: number) => {
      const ref = clipIdsOrdered[index];
      if (ref == null) {
        return;
      }
      void onUpdateConfigField(ANIMATION_SOLO_CLIP_REF_KEY, ref);
      patchClipAtIndex(index, { enabled: true });
    },
    [clipIdsOrdered, onUpdateConfigField, patchClipAtIndex],
  );

  const onPlayPause = useCallback(
    (playing: boolean) => {
      if (catalogBlendMode === "single") {
        if (!playing) {
          onSetPlayingRefs([]);
          return;
        }
        const ref = clipIdsOrdered[currentClipIndex];
        if (ref != null) {
          patchClipAtIndex(currentClipIndex, { enabled: true });
          onSetPlayingRefs([ref]);
        }
        return;
      }
      setBlendPlaying(playing);
      if (playing) {
        for (let i = 0; i < clipIdsOrdered.length; i++) {
          patchClipAtIndex(i, { enabled: true });
        }
      }
    },
    [catalogBlendMode, clipIdsOrdered, currentClipIndex, onSetPlayingRefs, patchClipAtIndex],
  );

  const onClipWeightChange = useCallback(
    (index: number, weight: number) => {
      patchClipAtIndex(index, { weight: Math.min(1, Math.max(0, weight)) });
    },
    [patchClipAtIndex],
  );

  const onClipSpeedChange = useCallback(
    (index: number, speed: number) => {
      patchClipAtIndex(index, { speed });
    },
    [patchClipAtIndex],
  );

  const onClipLoopChange = useCallback(
    (index: number, loop: AnimationClipLoop) => {
      patchClipAtIndex(index, { loopMode: fromCatalogLoop(loop) });
    },
    [patchClipAtIndex],
  );

  const onClipScrubChange = useCallback(
    (index: number, normalized: number | null) => {
      if (normalized == null) {
        return;
      }
      const dur = clipDurations[index] ?? 0;
      const clip = clipStates[index]!;
      const timeS = timeFromNormalizedPlayhead(normalized, clip, dur);
      onLiveClipPatch(clipIdsOrdered[index]!, { timeS, enabled: true });
    },
    [clipDurations, clipIdsOrdered, clipStates, onLiveClipPatch],
  );

  const onScrubChange = useCallback(
    (normalized: number | null) => {
      onClipScrubChange(currentClipIndex, normalized);
    },
    [currentClipIndex, onClipScrubChange],
  );

  const onCrossfadeDurationChange = useCallback(
    (duration: number) => {
      void onUpdateConfigField(ANIMATION_CROSSFADE_S_KEY, duration);
    },
    [onUpdateConfigField],
  );

  const onBlendCompactViewChange = useCallback(
    (compact: boolean) => {
      void onUpdateConfigField(ANIMATION_BLEND_COMPACT_VIEW_KEY, compact);
    },
    [onUpdateConfigField],
  );

  const onReset = useCallback(() => {
    const dc = defaultConfig;
    const rawClips = readClipMap(dc);
    const next: Record<string, FlowWireAnimationClipV1> = {};
    for (const ref of clipIdsOrdered) {
      const dur = durationByRef.get(ref) ?? 0;
      const { trimStartS } = resolveFlowWireClipTrimRange(
        mergeGlbBundleClipState(rawClips, ref, {})[ref]!,
        dur,
      );
      next[ref] = {
        ...mergeGlbBundleClipState(rawClips, ref, {})[ref]!,
        timeS: trimStartS,
        speed: 1,
        weight: 1,
        loopMode: "loop",
        enabled: true,
      };
    }
    void onUpdateConfigField("clips", next);
    void onUpdateConfigField(ANIMATION_CROSSFADE_S_KEY, 0.3);
    onSetPlayingRefs([]);
    setBlendPlaying(false);
  }, [clipIdsOrdered, defaultConfig, durationByRef, onSetPlayingRefs, onUpdateConfigField]);

  return (
    <div className="flex flex-col gap-2">
      <PreviewAnimationCard
        contentOnly
        hideModeSelector={sequenceMode}
        clipNames={clipNames}
        clipDurations={clipDurations}
        currentClipIndex={currentClipIndex}
        isPlaying={isPlaying}
        blendMode={catalogBlendMode}
        clipWeights={clipWeights}
        clipSpeeds={clipSpeeds}
        clipLoops={clipLoops}
        clipScrubTimes={clipScrubTimes}
        crossfadeDuration={crossfadeDuration}
        scrubTime={singleScrubTime}
        blendCompactView={blendCompactView}
        onClipChange={onClipChange}
        onPlayPause={onPlayPause}
        onBlendModeChange={onBlendModeChange}
        onClipWeightChange={onClipWeightChange}
        onClipSpeedChange={onClipSpeedChange}
        onClipLoopChange={onClipLoopChange}
        onClipScrubChange={onClipScrubChange}
        onCrossfadeDurationChange={onCrossfadeDurationChange}
        onScrubChange={onScrubChange}
        onBlendCompactViewChange={onBlendCompactViewChange}
        onReset={onReset}
      />
      <TRNInlineToggleRow
        label="Sequence (one clip at a time)"
        hint="Plays enabled clips in list order; use card order from the GLB extraction list."
        checked={sequenceMode}
        onCheckedChange={onSequenceToggle}
      />
      {sequenceMode ? (
        <TRNHintText className="text-[10px]">
          Sequence mode uses the same per-clip controls as Blend. Clips advance when a once loop reaches trim end.
        </TRNHintText>
      ) : null}
    </div>
  );
}
