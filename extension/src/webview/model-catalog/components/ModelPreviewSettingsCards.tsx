import React, { useMemo } from 'react';
import { Globe, Camera, MousePointer, Crosshair, Play } from 'lucide-react';
import { LabeledSlider, SortableCardList, type SortableCardItem } from '../../ui/catalog/index.js';
import type {
  PreviewClickTargetMode,
  AnimationClipLoop,
} from '../persisted-settings';
import type { ModelPreviewAnimationCallbacks } from '../hooks';
import { PreviewAnimationCard } from './PreviewAnimationCard';
import { PreviewCameraCard } from './PreviewCameraCard';
import { PreviewClickTargetModeControl } from './PreviewClickTargetModeControl';
import { PreviewMainEnvironmentSettingsCard } from './PreviewMainEnvironmentSettingsCard';

export interface ModelPreviewSettingsCardsProps {
  panelId: string;
  envPresetIndex: number;
  envIntensity: number;
  envEnableHDRI: boolean;
  envEnablePBR: boolean;
  solidBackgroundColor: string;
  onEnvPresetIndexChange: (index: number) => void;
  onEnvIntensityChange: (value: number) => void;
  onEnvEnableHDRIChange: (value: boolean) => void;
  onEnvEnablePBRChange: (value: boolean) => void;
  onSolidBackgroundColorChange: (value: string) => void;
  previewFov: number;
  previewFovSource: 'saved' | 'model';
  onPreviewFovChange: (value: number) => void;
  onPreviewFovSourceChange: (value: 'saved' | 'model') => void;
  clickTargetMode: PreviewClickTargetMode;
  onClickTargetModeChange: (value: PreviewClickTargetMode) => void;
  pivotRetargetDurationMs: number;
  onPivotRetargetDurationMsChange: (ms: number) => void;
  hasAnimations: boolean;
  animationClipNames: string[];
  animationClipDurations: number[];
  currentAnimationClipIndex: number;
  isAnimationPlaying: boolean;
  animationBlendMode: 'single' | 'blend';
  animationClipWeights: number[];
  animationClipSpeeds: number[];
  animationClipLoops: AnimationClipLoop[];
  animationCrossfadeDuration: number;
  animationScrubTime: number | null;
  animationClipScrubTimes: number[];
  animationBlendCompactView: boolean;
  animationCallbacks: ModelPreviewAnimationCallbacks;
}

export function ModelPreviewSettingsCards({
  panelId,
  envPresetIndex,
  envIntensity,
  envEnableHDRI,
  envEnablePBR,
  solidBackgroundColor,
  onEnvPresetIndexChange,
  onEnvIntensityChange,
  onEnvEnableHDRIChange,
  onEnvEnablePBRChange,
  onSolidBackgroundColorChange,
  previewFov,
  previewFovSource,
  onPreviewFovChange,
  onPreviewFovSourceChange,
  clickTargetMode,
  onClickTargetModeChange,
  pivotRetargetDurationMs,
  onPivotRetargetDurationMsChange,
  hasAnimations,
  animationClipNames,
  animationClipDurations,
  currentAnimationClipIndex,
  isAnimationPlaying,
  animationBlendMode,
  animationClipWeights,
  animationClipSpeeds,
  animationClipLoops,
  animationCrossfadeDuration,
  animationScrubTime,
  animationClipScrubTimes,
  animationBlendCompactView,
  animationCallbacks,
}: ModelPreviewSettingsCardsProps) {
  const items: SortableCardItem[] = useMemo(
    () => [
      {
        id: 'environment',
        title: 'Environment Settings',
        icon: Globe,
        content: (
          <PreviewMainEnvironmentSettingsCard
            envPresetIndex={envPresetIndex}
            envIntensity={envIntensity}
            envEnableHDRI={envEnableHDRI}
            envEnablePBR={envEnablePBR}
            solidBackgroundColor={solidBackgroundColor}
            onEnvPresetIndexChange={onEnvPresetIndexChange}
            onEnvIntensityChange={onEnvIntensityChange}
            onEnvEnableHDRIChange={onEnvEnableHDRIChange}
            onEnvEnablePBRChange={onEnvEnablePBRChange}
            onSolidBackgroundColorChange={onSolidBackgroundColorChange}
            contentOnly
          />
        ),
      },
      {
        id: 'camera',
        title: 'Camera',
        icon: Camera,
        content: (
          <PreviewCameraCard
            previewFov={previewFov}
            previewFovSource={previewFovSource}
            onPreviewFovChange={onPreviewFovChange}
            onPreviewFovSourceChange={onPreviewFovSourceChange}
            contentOnly
          />
        ),
      },
      ...(hasAnimations
        ? [
            {
              id: 'animation',
              title: 'Animation',
              icon: Play,
              content: (
                <PreviewAnimationCard
                  clipNames={animationClipNames}
                  clipDurations={animationClipDurations}
                  currentClipIndex={currentAnimationClipIndex}
                  isPlaying={isAnimationPlaying}
                  blendMode={animationBlendMode}
                  clipWeights={animationClipWeights}
                  clipSpeeds={animationClipSpeeds}
                  clipLoops={animationClipLoops}
                  clipScrubTimes={animationClipScrubTimes}
                  crossfadeDuration={animationCrossfadeDuration}
                  scrubTime={animationScrubTime}
                  blendCompactView={animationBlendCompactView}
                  onClipChange={animationCallbacks.onClipChange}
                  onPlayPause={animationCallbacks.onPlayPause}
                  onBlendModeChange={animationCallbacks.onBlendModeChange}
                  onClipWeightChange={animationCallbacks.onClipWeightChange}
                  onClipSpeedChange={animationCallbacks.onClipSpeedChange}
                  onClipLoopChange={animationCallbacks.onClipLoopChange}
                  onClipScrubChange={animationCallbacks.onClipScrubChange}
                  onCrossfadeDurationChange={
                    animationCallbacks.onCrossfadeDurationChange
                  }
                  onScrubChange={animationCallbacks.onScrubChange}
                  onBlendCompactViewChange={
                    animationCallbacks.onBlendCompactViewChange
                  }
                  onReset={animationCallbacks.onReset}
                  contentOnly
                />
              ),
            } as SortableCardItem,
          ]
        : []),
      {
        id: 'click-target',
        title: 'Click Target Mode',
        icon: MousePointer,
        content: (
          <PreviewClickTargetModeControl
            value={clickTargetMode}
            onChange={onClickTargetModeChange}
          />
        ),
      },
      {
        id: 'raycast',
        title: 'Raycast Retarget',
        icon: Crosshair,
        content: (
          <div className="space-y-2 rounded-lg border border-white/10 bg-white/2 p-3">
            <LabeledSlider
              label="Raycast retarget duration (seconds)"
              value={pivotRetargetDurationMs / 1000}
              min={0.5}
              max={5}
              step={0.6}
              onChange={(sec) => {
                if (!Number.isFinite(sec)) return;
                onPivotRetargetDurationMsChange(
                  Math.max(0, Math.round(sec * 1000))
                );
              }}
              formatValue={(v) => `${v.toFixed(2)}s`}
            />
          </div>
        ),
      },
    ],
    [
      envPresetIndex,
      envIntensity,
      envEnableHDRI,
      envEnablePBR,
      solidBackgroundColor,
      onEnvPresetIndexChange,
      onEnvIntensityChange,
      onEnvEnableHDRIChange,
      onEnvEnablePBRChange,
      onSolidBackgroundColorChange,
      previewFov,
      previewFovSource,
      onPreviewFovChange,
      onPreviewFovSourceChange,
      clickTargetMode,
      onClickTargetModeChange,
      pivotRetargetDurationMs,
      onPivotRetargetDurationMsChange,
      hasAnimations,
      animationClipNames,
      animationClipDurations,
      currentAnimationClipIndex,
      isAnimationPlaying,
      animationBlendMode,
      animationClipWeights,
      animationClipSpeeds,
      animationClipLoops,
      animationCrossfadeDuration,
      animationScrubTime,
      animationBlendCompactView,
      animationCallbacks,
    ]
  );

  return <SortableCardList items={items} panelId={panelId} />;
}
