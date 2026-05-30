import React from 'react';
import { Camera, Save } from 'lucide-react';
import { OptionButtonGroup } from '../../ui/components/OptionButtonGroup';
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
    <div className="space-y-1.5">
      <label className="block text-xs text-gray-300">FOV source</label>
      <OptionButtonGroup
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
    </div>
  );
}
