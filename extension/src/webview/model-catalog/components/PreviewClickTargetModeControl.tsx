import React from 'react';
import { Crosshair, Target } from 'lucide-react';
import { OptionButtonGroup } from '../../ui/components/OptionButtonGroup';
import type { PreviewClickTargetMode } from '../persisted-settings';

export interface PreviewClickTargetModeControlProps {
  value: PreviewClickTargetMode;
  onChange: (value: PreviewClickTargetMode) => void;
}

export function PreviewClickTargetModeControl({
  value,
  onChange,
}: PreviewClickTargetModeControlProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-gray-300">Click target mode</label>
      <OptionButtonGroup
        value={value}
        layout="row"
        options={[
          {
            value: 'object-origin',
            label: 'Object origin',
            title: "Orbit target uses clicked object's world origin",
            icon: Target,
          },
          {
            value: 'hit-point',
            label: 'Hit point',
            title: 'Orbit target uses the exact raycast hit point',
            icon: Crosshair,
          },
        ]}
        onChange={onChange}
      />
    </div>
  );
}
