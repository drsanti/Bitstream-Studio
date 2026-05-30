import React, { useCallback } from 'react';
import * as THREE from 'three';
import { applyLoopToAction } from '../model-preview-utils';
import type { AnimationBlendMode, AnimationClipLoop } from '../persisted-settings';

export interface UseModelPreviewAnimationCallbacksParams {
  animationMixerRef: React.RefObject<THREE.AnimationMixer | null>;
  animationClipsRef: React.RefObject<THREE.AnimationClip[]>;
  currentAnimationActionRef: React.RefObject<THREE.AnimationAction | null>;
  animationActionsRef: React.RefObject<Map<number, THREE.AnimationAction>>;
  scrubActiveRef: React.RefObject<boolean>;
  currentAnimationClipIndex: number;
  animationBlendMode: AnimationBlendMode;
  animationClipWeights: number[];
  animationClipSpeeds: number[];
  animationClipLoops: AnimationClipLoop[];
  animationClipScrubTimes: number[];
  animationCrossfadeDuration: number;
  animationClipNames: string[];
  setCurrentAnimationClipIndex: (index: number) => void;
  setIsAnimationPlaying: (playing: boolean) => void;
  setAnimationBlendMode: (mode: AnimationBlendMode) => void;
  setAnimationClipWeights: React.Dispatch<React.SetStateAction<number[]>>;
  setAnimationClipSpeeds: React.Dispatch<React.SetStateAction<number[]>>;
  setAnimationClipLoops: React.Dispatch<React.SetStateAction<AnimationClipLoop[]>>;
  setAnimationClipScrubTimes: React.Dispatch<
    React.SetStateAction<number[]>
  >;
  setAnimationCrossfadeDuration: (duration: number) => void;
  setAnimationScrubTime: (time: number | null) => void;
  setAnimationBlendCompactView: (compact: boolean) => void;
}

export interface ModelPreviewAnimationCallbacks {
  onClipChange: (index: number) => void;
  onPlayPause: (playing: boolean) => void;
  onBlendModeChange: (mode: AnimationBlendMode) => void;
  onClipWeightChange: (index: number, weight: number) => void;
  onClipSpeedChange: (index: number, speed: number) => void;
  onClipLoopChange: (index: number, loop: AnimationClipLoop) => void;
  onClipScrubChange: (
    index: number,
    normalized: number | null
  ) => void;
  onCrossfadeDurationChange: (duration: number) => void;
  onScrubChange: (normalized: number | null) => void;
  onBlendCompactViewChange: (compact: boolean) => void;
  onReset: () => void;
}

export function useModelPreviewAnimationCallbacks(
  params: UseModelPreviewAnimationCallbacksParams
): ModelPreviewAnimationCallbacks {
  const {
    animationMixerRef,
    animationClipsRef,
    currentAnimationActionRef,
    animationActionsRef,
    scrubActiveRef,
    currentAnimationClipIndex,
    animationBlendMode,
    animationClipWeights,
    animationClipSpeeds,
    animationClipLoops,
    animationClipScrubTimes,
    animationCrossfadeDuration,
    animationClipNames,
    setCurrentAnimationClipIndex,
    setIsAnimationPlaying,
    setAnimationBlendMode,
    setAnimationClipWeights,
    setAnimationClipSpeeds,
    setAnimationClipLoops,
    setAnimationClipScrubTimes,
    setAnimationCrossfadeDuration,
    setAnimationScrubTime,
    setAnimationBlendCompactView,
  } = params;

  const onClipChange = useCallback(
    (index: number) => {
      const mixer = animationMixerRef.current;
      const clips = animationClipsRef.current;
      const crossfade = animationCrossfadeDuration;
      if (
        mixer &&
        clips[index] &&
        animationBlendMode === 'single'
      ) {
        const currentAction = currentAnimationActionRef.current;
        const newAction = mixer.clipAction(clips[index]);
        if (currentAction && crossfade > 0) {
          currentAction.crossFadeTo(newAction, crossfade, false);
        } else {
          currentAction?.stop();
          newAction.play();
        }
        applyLoopToAction(newAction, animationClipLoops[index]);
        newAction.timeScale = animationClipSpeeds[index] ?? 1;
        currentAnimationActionRef.current = newAction;
        mixer.timeScale = 1;
      }
      setCurrentAnimationClipIndex(index);
      setIsAnimationPlaying(true);
    },
    [
      animationMixerRef,
      animationClipsRef,
      animationCrossfadeDuration,
      animationBlendMode,
      animationClipLoops,
      animationClipSpeeds,
      currentAnimationActionRef,
      setCurrentAnimationClipIndex,
      setIsAnimationPlaying,
    ]
  );

  const onPlayPause = useCallback(
    (playing: boolean) => {
      if (playing) scrubActiveRef.current = false;
      const mixer = animationMixerRef.current;
      if (mixer) {
        mixer.timeScale = playing ? 1 : 0;
        if (
          playing &&
          !currentAnimationActionRef.current &&
          animationBlendMode === 'single'
        ) {
          const clips = animationClipsRef.current;
          const idx = currentAnimationClipIndex;
          if (clips[idx]) {
            const action = mixer.clipAction(clips[idx]);
            action.play();
            applyLoopToAction(action, animationClipLoops[idx]);
            action.timeScale = animationClipSpeeds[idx] ?? 1;
            currentAnimationActionRef.current = action;
          }
        }
      }
      setIsAnimationPlaying(playing);
    },
    [
      scrubActiveRef,
      animationMixerRef,
      currentAnimationActionRef,
      animationBlendMode,
      animationClipsRef,
      currentAnimationClipIndex,
      animationClipLoops,
      animationClipSpeeds,
      setIsAnimationPlaying,
    ]
  );

  const onBlendModeChange = useCallback(
    (mode: AnimationBlendMode) => {
      setAnimationBlendMode(mode);
      const mixer = animationMixerRef.current;
      const clips = animationClipsRef.current;
      if (!mixer || !clips.length) return;
      if (mode === 'blend') {
        currentAnimationActionRef.current?.stop();
        currentAnimationActionRef.current = null;
        const map = animationActionsRef.current;
        map.clear();
        clips.forEach((clip, i) => {
          const action = mixer.clipAction(clip);
          action.play();
          applyLoopToAction(action, animationClipLoops[i]);
          action.timeScale = animationClipSpeeds[i] ?? 1;
          action.setEffectiveWeight(animationClipWeights[i] ?? 0);
          map.set(i, action);
        });
        mixer.timeScale = 1;
      } else {
        animationActionsRef.current.forEach((a) => a.stop());
        animationActionsRef.current.clear();
        const idx = currentAnimationClipIndex;
        if (clips[idx]) {
          const action = mixer.clipAction(clips[idx]);
          action.play();
          applyLoopToAction(action, animationClipLoops[idx]);
          action.timeScale = animationClipSpeeds[idx] ?? 1;
          currentAnimationActionRef.current = action;
        }
        mixer.timeScale = 1;
      }
    },
    [
      setAnimationBlendMode,
      animationMixerRef,
      animationClipsRef,
      currentAnimationActionRef,
      animationActionsRef,
      animationClipLoops,
      animationClipSpeeds,
      animationClipWeights,
      currentAnimationClipIndex,
    ]
  );

  const onClipWeightChange = useCallback(
    (index: number, weight: number) => {
      setAnimationClipWeights((prev) => {
        const next = [...prev];
        next[index] = weight;
        return next;
      });
      animationActionsRef.current.get(index)?.setEffectiveWeight(weight);
    },
    [setAnimationClipWeights, animationActionsRef]
  );

  const onClipSpeedChange = useCallback(
    (index: number, speed: number) => {
      setAnimationClipSpeeds((prev) => {
        const next = [...prev];
        next[index] = speed;
        return next;
      });
      if (animationBlendMode === 'blend') {
        const a = animationActionsRef.current.get(index);
        if (a) a.timeScale = speed;
      } else if (index === currentAnimationClipIndex) {
        const a = currentAnimationActionRef.current;
        if (a) a.timeScale = speed;
      }
    },
    [
      setAnimationClipSpeeds,
      animationBlendMode,
      animationActionsRef,
      currentAnimationClipIndex,
      currentAnimationActionRef,
    ]
  );

  const onClipLoopChange = useCallback(
    (index: number, loop: AnimationClipLoop) => {
      setAnimationClipLoops((prev) => {
        const next = [...prev];
        next[index] = loop;
        return next;
      });
      const action =
        animationBlendMode === 'blend'
          ? animationActionsRef.current.get(index)
          : index === currentAnimationClipIndex
            ? currentAnimationActionRef.current
            : null;
      if (action) applyLoopToAction(action, loop);
    },
    [
      setAnimationClipLoops,
      animationBlendMode,
      animationActionsRef,
      currentAnimationClipIndex,
      currentAnimationActionRef,
    ]
  );

  const onClipScrubChange = useCallback(
    (index: number, normalized: number | null) => {
      if (normalized === null) return;

      setAnimationClipScrubTimes((prev) => {
        const next = [...prev];
        next[index] = normalized;
        return next;
      });

      scrubActiveRef.current = true;

      if (animationBlendMode !== 'blend') return;

      const mixer = animationMixerRef.current;
      const clips = animationClipsRef.current;
      const clip = clips[index];
      if (!mixer || !clip) return;

      mixer.timeScale = 0;

      const action =
        animationActionsRef.current.get(index) ??
        mixer.clipAction(clip);

      applyLoopToAction(action, animationClipLoops[index]);
      action.time = normalized * (clip.duration ?? 0);
      action.timeScale = animationClipSpeeds[index] ?? 1;
      action.setEffectiveWeight(animationClipWeights[index] ?? 0);

      // Ensure the action is registered for future updates.
      animationActionsRef.current.set(index, action);
      action.play();
    },
    [
      setAnimationClipScrubTimes,
      scrubActiveRef,
      animationBlendMode,
      animationMixerRef,
      animationClipsRef,
      animationActionsRef,
      animationClipLoops,
      animationClipSpeeds,
      animationClipWeights,
    ]
  );

  const onScrubChange = useCallback(
    (normalized: number | null) => {
      setAnimationScrubTime(normalized);
      scrubActiveRef.current = true;
      const mixer = animationMixerRef.current;
      const clips = animationClipsRef.current;
      const idx = currentAnimationClipIndex;
      if (
        mixer &&
        clips[idx] &&
        typeof normalized === 'number' &&
        animationBlendMode === 'single'
      ) {
        mixer.timeScale = 0;
        const action =
          currentAnimationActionRef.current ??
          mixer.clipAction(clips[idx]);
        action.time = normalized * (clips[idx].duration ?? 0);
        if (!currentAnimationActionRef.current) {
          action.play();
          applyLoopToAction(action, animationClipLoops[idx]);
          action.timeScale = animationClipSpeeds[idx] ?? 1;
          currentAnimationActionRef.current = action;
        }
      }
    },
    [
      setAnimationScrubTime,
      scrubActiveRef,
      animationMixerRef,
      animationClipsRef,
      currentAnimationClipIndex,
      animationBlendMode,
      currentAnimationActionRef,
      animationClipLoops,
      animationClipSpeeds,
    ]
  );

  const onReset = useCallback(() => {
    const n = animationClipNames.length;
    setAnimationClipWeights(
      Array(n).fill(1)
    );
    setAnimationClipSpeeds(Array(n).fill(1));
    setAnimationClipLoops(Array(n).fill('loop' as AnimationClipLoop));
    setAnimationCrossfadeDuration(0.3);
    const mixer = animationMixerRef.current;
    const clips = animationClipsRef.current;
    if (animationBlendMode === 'blend') {
      animationActionsRef.current.forEach((action, i) => {
        action.setEffectiveWeight(1);
        action.timeScale = 1;
        applyLoopToAction(action, 'loop');
      });
    } else {
      const a = currentAnimationActionRef.current;
      if (a) {
        a.setEffectiveWeight(1);
        a.timeScale = 1;
        applyLoopToAction(a, 'loop');
      }
    }
  }, [
    animationClipNames.length,
    setAnimationClipWeights,
    setAnimationClipSpeeds,
    setAnimationClipLoops,
    setAnimationCrossfadeDuration,
    animationMixerRef,
    animationClipsRef,
    animationBlendMode,
    animationActionsRef,
    currentAnimationActionRef,
  ]);

  return {
    onClipChange,
    onPlayPause,
    onBlendModeChange,
    onClipWeightChange,
    onClipSpeedChange,
    onClipLoopChange,
    onClipScrubChange,
    onCrossfadeDurationChange: setAnimationCrossfadeDuration,
    onScrubChange,
    onBlendCompactViewChange: setAnimationBlendCompactView,
    onReset,
  };
}
