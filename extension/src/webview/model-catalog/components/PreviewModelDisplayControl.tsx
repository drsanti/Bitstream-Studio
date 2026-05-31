import React from 'react';
import { TRNChipButtonGroup } from '../../ui/TRN/index.js';
import type { PreviewModelDisplayMode } from '../persisted-settings.js';
export interface PreviewModelDisplayControlProps {
  value: PreviewModelDisplayMode;
  onChange: (value: PreviewModelDisplayMode) => void;
  /** When true, only Shaded is available (selection highlight is active). */
  selectionHighlightActive?: boolean;
}

const DISPLAY_OPTIONS: {
  value: PreviewModelDisplayMode;
  label: string;
  title?: string;
}[] = [
  {
    value: 'shaded',
    label: 'Shaded',
    title: 'Standard PBR shading (default)',
  },
  {
    value: 'wireframe',
    label: 'Wireframe',
    title: 'Triangle wireframe on the entire model',
  },
  {
    value: 'shaded-wireframe',
    label: 'Both',
    title: 'Shaded surfaces plus triangle wireframe overlay',
  },
];

export function PreviewModelDisplayControl({
  value,
  onChange,
  selectionHighlightActive = false,
}: PreviewModelDisplayControlProps) {
  const options = DISPLAY_OPTIONS.map((option) => ({
    ...option,
    disabled:
      selectionHighlightActive &&
      option.value !== 'shaded',
    title:
      selectionHighlightActive && option.value !== 'shaded'
        ? 'Switch selection highlight to Off to use whole-model wireframe'
        : option.title,
  }));

  return (
    <div className="space-y-3">
      <TRNChipButtonGroup
        label="Model view"
        value={value}
        onChange={onChange}
        options={options}
        columns={3}
        ariaLabel="Whole model display mode"
      />
    </div>
  );
}
