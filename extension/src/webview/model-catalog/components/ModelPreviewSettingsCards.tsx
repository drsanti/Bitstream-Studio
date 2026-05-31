import React, { useMemo } from 'react';
import { Globe, Camera, MousePointer, Crosshair, Play, Sparkles, Grid3x3 } from 'lucide-react';
import {
  TRNHintTooltip,
  TRNParameterSlider,
  TRNSortableSettingsCardList,
  type TRNSortableSettingsCardItem,
} from '../../ui/TRN/index.js';
import type {
  PreviewClickTargetMode,
  PreviewSelectionHighlightMode,
  PreviewModelDisplayMode,
  AnimationClipLoop,
} from '../persisted-settings';
import type { ModelPreviewAnimationCallbacks } from '../hooks';
import { PreviewAnimationCard } from './PreviewAnimationCard';
import { PreviewCameraCard } from './PreviewCameraCard';
import { PreviewClickTargetModeControl } from './PreviewClickTargetModeControl';
import { PreviewMainEnvironmentSettingsCard } from './PreviewMainEnvironmentSettingsCard';
import { PreviewSelectionHighlightControl } from './PreviewSelectionHighlightControl';
import { PreviewModelDisplayControl } from './PreviewModelDisplayControl';

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
  selectionHighlightMode: PreviewSelectionHighlightMode;
  onSelectionHighlightModeChange: (value: PreviewSelectionHighlightMode) => void;
  modelDisplayMode: PreviewModelDisplayMode;
  onModelDisplayModeChange: (value: PreviewModelDisplayMode) => void;
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
  selectionHighlightMode,
  onSelectionHighlightModeChange,
  modelDisplayMode,
  onModelDisplayModeChange,
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
  const selectionHighlightActive = selectionHighlightMode !== 'off';
  const modelDisplayIconHint = selectionHighlightActive
    ? 'Whole-model wireframe is disabled while a selection highlight is active — model view stays Shaded.'
    : 'Applies to the full GLB. Skinned meshes stay shaded-only in "Both" mode.';

  const items: TRNSortableSettingsCardItem[] = useMemo(
    () => [
      {
        id: 'environment',
        title: 'Environment Settings',
        icon: <Globe className="h-4 w-4" />,
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
        icon: <Camera className="h-4 w-4" />,
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
              icon: <Play className="h-4 w-4" />,
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
            } as TRNSortableSettingsCardItem,
          ]
        : []),
      {
        id: 'click-target',
        title: 'Click Target Mode',
        icon: <MousePointer className="h-4 w-4" />,
        content: (
          <PreviewClickTargetModeControl
            value={clickTargetMode}
            onChange={onClickTargetModeChange}
          />
        ),
      },
      {
        id: 'model-display',
        title: 'Model Display',
        icon: (
          <TRNHintTooltip
            trigger={<Grid3x3 className="h-4 w-4" />}
            content={modelDisplayIconHint}
            triggerAriaLabel="About Model Display"
            placement="top-start"
          />
        ),
        content: (
          <PreviewModelDisplayControl
            value={modelDisplayMode}
            onChange={onModelDisplayModeChange}
            selectionHighlightActive={selectionHighlightActive}
          />
        ),
      },
      {
        id: 'selection-highlight',
        title: 'Selection Highlight',
        icon: <Sparkles className="h-4 w-4" />,
        content: (
          <PreviewSelectionHighlightControl
            value={selectionHighlightMode}
            onChange={onSelectionHighlightModeChange}
          />
        ),
      },
      {
        id: 'raycast',
        title: 'Raycast Retarget',
        icon: <Crosshair className="h-4 w-4" />,
        content: (
          <TRNParameterSlider
            name="Raycast retarget duration"
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
            valueFormatter={(v) => `${v.toFixed(2)}s`}
          />
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
      selectionHighlightMode,
      selectionHighlightActive,
      modelDisplayIconHint,
      onSelectionHighlightModeChange,
      modelDisplayMode,
      onModelDisplayModeChange,
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

  return <TRNSortableSettingsCardList items={items} panelId={panelId} />;
}
