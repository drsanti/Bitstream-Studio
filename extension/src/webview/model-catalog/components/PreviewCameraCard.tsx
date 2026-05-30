import React from 'react';
import { Camera } from 'lucide-react';
import { CollapsibleCard, LabeledSlider } from '../../ui/catalog/index.js';
import { PreviewFovSourceControl } from './PreviewFovSourceControl';
import type { PreviewFovSourceMode } from '../persisted-settings';

export interface PreviewCameraCardProps {
  previewFov: number;
  previewFovSource: PreviewFovSourceMode;
  onPreviewFovChange: (value: number) => void;
  onPreviewFovSourceChange: (value: PreviewFovSourceMode) => void;
  defaultExpanded?: boolean;
  /** When true, render only the inner content without CollapsibleCard wrapper (for use in SortableCardList) */
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
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/2 p-3">
          <LabeledSlider
            label="FOV"
            value={previewFov}
            min={5}
            max={140}
            step={0.1}
            onChange={onPreviewFovChange}
            formatValue={(v) => v.toFixed(1)}
          />
        </div>
      </div>
  );

  if (contentOnly) return content;

  return (
    <CollapsibleCard
      title="Camera"
      icon={Camera}
      defaultExpanded={defaultExpanded}
    >
      {content}
    </CollapsibleCard>
  );
}
