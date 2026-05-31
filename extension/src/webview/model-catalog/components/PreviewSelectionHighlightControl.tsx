import React from 'react';
import { TRNChipButtonGroup, TRNHintText } from '../../ui/TRN/index.js';
import type { PreviewSelectionHighlightMode } from '../persisted-settings.js';

export interface PreviewSelectionHighlightControlProps {
  value: PreviewSelectionHighlightMode;
  onChange: (value: PreviewSelectionHighlightMode) => void;
}

const HIGHLIGHT_OPTIONS: {
  value: PreviewSelectionHighlightMode;
  label: string;
  title?: string;
}[] = [
  { value: 'off', label: 'Off', title: 'No visual highlight on selected parts' },
  {
    value: 'emissive',
    label: 'Glow',
    title: 'Cyan emissive tint on the clicked mesh',
  },
  {
    value: 'edges',
    label: 'Edges',
    title: 'Hard crease edges only (not every triangle)',
  },
  {
    value: 'wireframe',
    label: 'Wireframe',
    title: 'Full triangle wireframe on the selected mesh',
  },
  {
    value: 'box',
    label: 'Box',
    title: 'Axis-aligned bounding box around the selection',
  },
  {
    value: 'outline',
    label: 'Outline',
    title: 'Expanded back-face hull (falls back to box on skinned meshes)',
  },
];

export function PreviewSelectionHighlightControl({
  value,
  onChange,
}: PreviewSelectionHighlightControlProps) {
  return (
    <div className="space-y-3">
      <TRNChipButtonGroup
        label="Highlight style"
        value={value}
        onChange={onChange}
        options={HIGHLIGHT_OPTIONS}
        columns={3}
        ariaLabel="Selection highlight style"
      />
      <TRNHintText className="text-[10px]">
        Selected part only. Click a mesh in the viewer; empty click clears
        selection and highlight.
      </TRNHintText>
    </div>
  );
}
