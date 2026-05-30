import React, { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import {
  ButtonGroup,
  CollapsibleCard,
  LabeledSlider,
  LabeledSwitch,
} from '@ternion/t3d/ui';

export interface PreviewMainEnvironmentSettingsCardProps {
  envPresetIndex: number;
  envIntensity: number;
  envEnableHDRI: boolean;
  envEnablePBR: boolean;
  solidBackgroundColor: string;
  onEnvPresetIndexChange: (value: number) => void;
  onEnvIntensityChange: (value: number) => void;
  onEnvEnableHDRIChange: (value: boolean) => void;
  onEnvEnablePBRChange: (value: boolean) => void;
  onSolidBackgroundColorChange: (value: string) => void;
  defaultExpanded?: boolean;
  /** When true, render only the inner content without CollapsibleCard wrapper (for use in SortableCardList) */
  contentOnly?: boolean;
}

export function PreviewMainEnvironmentSettingsCard({
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
  defaultExpanded = true,
  contentOnly = false,
}: PreviewMainEnvironmentSettingsCardProps) {
  const [pendingPreset, setPendingPreset] = useState<number | null>(null);

  const presetOptions = useMemo(
    () =>
      getEngineEnvironmentCubeMaps().map((preset, index) => ({
        value: index,
        label: preset.title,
        loading: pendingPreset === index,
        disabled: false,
      })),
    [pendingPreset]
  );

  const handlePresetChange = (index: number) => {
    if (index === envPresetIndex || pendingPreset !== null) return;
    setPendingPreset(index);
    try {
      onEnvPresetIndexChange(index);
    } finally {
      setPendingPreset(null);
    }
  };

  const content = (
    <div className="space-y-3">
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/2 p-3">
          <ButtonGroup
            label="HDRI Environment"
            value={envPresetIndex}
            onChange={handlePresetChange}
            options={presetOptions}
            disabled={false}
            buttonPadding="sm"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-white/10 bg-white/2 p-3">
          <LabeledSlider
            label="Environment Intensity"
            value={envIntensity}
            min={0}
            max={5}
            step={0.1}
            onChange={onEnvIntensityChange}
            disabled={false}
            formatValue={(value) => value.toFixed(2)}
          />
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-white/2 p-3">
          <LabeledSwitch
            label="Enable HDRI Background"
            checked={envEnableHDRI}
            onChange={onEnvEnableHDRIChange}
            disabled={false}
          />
        </div>

        {!envEnableHDRI && (
          <div className="space-y-3 rounded-lg border border-white/10 bg-white/2 p-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Background Color
              </label>
              <input
                type="color"
                value={solidBackgroundColor}
                onChange={(e) => onSolidBackgroundColorChange(e.target.value)}
                className="h-8 w-14 rounded border border-gray-500/50 bg-transparent p-0.5 cursor-pointer"
                title="Pick solid background color when HDRI is disabled"
              />
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-white/10 bg-white/2 p-3">
          <LabeledSwitch
            label="Enable PBR Lighting"
            checked={envEnablePBR}
            onChange={onEnvEnablePBRChange}
            disabled={false}
          />
        </div>
      </div>
  );

  if (contentOnly) return content;

  return (
    <CollapsibleCard
      title="Environment Settings"
      icon={Globe}
      defaultExpanded={defaultExpanded}
    >
      {content}
    </CollapsibleCard>
  );
}
