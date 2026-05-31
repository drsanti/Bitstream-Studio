import React from 'react';
import { Crosshair, Target } from 'lucide-react';
import { TRNIconOptionGroup } from '../../ui/TRN/index.js';
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
    <TRNIconOptionGroup
      label="Click target mode"
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
  );
}
