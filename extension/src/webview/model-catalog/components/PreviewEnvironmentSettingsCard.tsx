import React from 'react';
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { Slider } from '../../ui/components/Slider';

export interface PreviewEnvironmentSettingsCardProps {
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
}

export function PreviewEnvironmentSettingsCard({
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
}: PreviewEnvironmentSettingsCardProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs text-gray-300">Environment preset</label>
      <select
        value={envPresetIndex}
        onChange={(e) => onEnvPresetIndexChange(Number(e.target.value))}
        className="w-full h-8 rounded border border-gray-500/50 bg-gray-800/70 px-2 text-xs text-gray-100 outline-none"
      >
        {getEngineEnvironmentCubeMaps().map((preset, idx) => (
          <option key={`${preset.title}-${idx}`} value={idx}>
            {preset.title}
          </option>
        ))}
      </select>

      <Slider
        label="Environment intensity"
        valueLabel={envIntensity.toFixed(2)}
        min={0}
        max={5}
        step={0.1}
        value={envIntensity}
        onChange={(e) => onEnvIntensityChange(Number(e.target.value))}
      />

      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[11px] text-gray-200">
          <input
            type="checkbox"
            checked={envEnableHDRI}
            onChange={(e) => onEnvEnableHDRIChange(e.target.checked)}
          />
          HDRI Background
        </label>
        <label className="flex items-center gap-2 text-[11px] text-gray-200">
          <input
            type="checkbox"
            checked={envEnablePBR}
            onChange={(e) => onEnvEnablePBRChange(e.target.checked)}
          />
          PBR Reflection
        </label>
      </div>

      {!envEnableHDRI && (
        <div className="space-y-1">
          <label className="block text-xs text-gray-300">Solid background color</label>
          <input
            type="color"
            value={solidBackgroundColor}
            onChange={(e) => onSolidBackgroundColorChange(e.target.value)}
            className="h-8 w-14 rounded border border-gray-500/50 bg-transparent p-0.5"
            title="Pick solid background color when HDRI is disabled"
          />
        </div>
      )}
    </div>
  );
}
