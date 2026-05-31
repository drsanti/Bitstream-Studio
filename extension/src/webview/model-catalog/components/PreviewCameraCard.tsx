import React from 'react';
import { Camera } from 'lucide-react';
import { TRNCard, TRNParameterSlider } from '../../ui/TRN/index.js';
import { PreviewFovSourceControl } from './PreviewFovSourceControl';
import type { PreviewFovSourceMode } from '../persisted-settings';

export interface PreviewCameraCardProps {
  previewFov: number;
  previewFovSource: PreviewFovSourceMode;
  onPreviewFovChange: (value: number) => void;
  onPreviewFovSourceChange: (value: PreviewFovSourceMode) => void;
  defaultExpanded?: boolean;
  /** When true, render only the inner content without TRNCard wrapper (for use in sortable list) */
  contentOnly?: boolean;
}

export function PreviewCameraCard({
  previewFov,
  previewFovSource,
  onPreviewFovChange,
  onPreviewFovSourceChange,
  defaultExpanded = true,
  contentOnly = false,
}: PreviewCameraCardProps) {
  const content = (
    <div className="space-y-3">
      <PreviewFovSourceControl
        value={previewFovSource}
        onChange={onPreviewFovSourceChange}
      />
      <TRNParameterSlider
        name="FOV"
        value={previewFov}
        min={5}
        max={140}
        step={0.1}
        onChange={onPreviewFovChange}
        valueFormatter={(v) => v.toFixed(1)}
      />
    </div>
  );

  if (contentOnly) return content;

  return (
    <TRNCard
      title="Camera"
      icon={<Camera className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
      glass
      glassPreset="soft"
    >
      {content}
    </TRNCard>
  );
}
