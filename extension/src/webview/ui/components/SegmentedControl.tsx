import React from 'react';
import { Button } from './Button';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded border border-gray-500/50 bg-gray-800/50 p-1 ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Button
            key={opt.value}
            variant="secondary"
            className={`px-2 py-1 text-[11px] border ${
              selected
                ? 'border-gray-500/50 bg-emerald-600/70 text-white'
                : 'border-gray-500/50 bg-gray-700/80 text-gray-100'
            } hover:bg-gray-600/80`}
            onClick={() => onChange(opt.value)}
            title={opt.title}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
