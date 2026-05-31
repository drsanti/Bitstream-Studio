import React, { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import {
  TRNCard,
  TRNChipButtonGroup,
  TRNFormField,
  TRNFormSection,
  TRNInlineToggleRow,
  TRNParameterSlider,
} from '../../ui/TRN/index.js';

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
  /** When true, render only the inner content without TRNCard wrapper (for use in sortable list) */
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
      <TRNFormSection title="HDRI preset">
        <TRNChipButtonGroup
          value={envPresetIndex}
          onChange={handlePresetChange}
          options={presetOptions}
          columns={3}
          ariaLabel="HDRI environment preset"
        />
      </TRNFormSection>

      <TRNParameterSlider
        name="Environment intensity"
        value={envIntensity}
        min={0}
        max={5}
        step={0.1}
        onChange={onEnvIntensityChange}
        valueFormatter={(value) => value.toFixed(2)}
      />

      <TRNInlineToggleRow
        label="Enable HDRI background"
        checked={envEnableHDRI}
        onCheckedChange={onEnvEnableHDRIChange}
      />

      {!envEnableHDRI && (
        <TRNFormField label="Background color">
          <input
            type="color"
            value={solidBackgroundColor}
            onChange={(e) => onSolidBackgroundColorChange(e.target.value)}
            className="h-8 w-full max-w-[5.5rem] cursor-pointer rounded border border-zinc-700/80 bg-transparent p-0.5"
            title="Pick solid background color when HDRI is disabled"
          />
        </TRNFormField>
      )}

      <TRNInlineToggleRow
        label="Enable PBR lighting"
        checked={envEnablePBR}
        onCheckedChange={onEnvEnablePBRChange}
      />
    </div>
  );

  if (contentOnly) return content;

  return (
    <TRNCard
      title="Environment Settings"
      icon={<Globe className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
      glass
      glassPreset="soft"
    >
      {content}
    </TRNCard>
  );
}
