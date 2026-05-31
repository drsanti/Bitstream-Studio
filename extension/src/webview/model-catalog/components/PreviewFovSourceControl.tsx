import React from 'react';
import { Camera, Save } from 'lucide-react';
import { TRNIconOptionGroup } from '../../ui/TRN/index.js';
import type { PreviewFovSourceMode } from '../persisted-settings';

export interface PreviewFovSourceControlProps {
  value: PreviewFovSourceMode;
  onChange: (value: PreviewFovSourceMode) => void;
}

export function PreviewFovSourceControl({
  value,
  onChange,
}: PreviewFovSourceControlProps) {
  return (
    <TRNIconOptionGroup
      label="FOV source"
      value={value}
      layout="row"
      options={[
        {
          value: 'model',
          label: 'Model FOV',
          title: 'Always use FOV from model camera',
          icon: Camera,
        },
        {
          value: 'saved',
          label: 'Saved FOV',
          title: 'Use your saved FOV value',
          icon: Save,
        },
      ]}
      onChange={onChange}
    />
  );
}
