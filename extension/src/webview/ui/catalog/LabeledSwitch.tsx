import React from 'react';
import { Zap, Wrench } from 'lucide-react';
import { cn } from './cn.js';

export interface LabeledSwitchProps
{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelTextColor?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  labelClassName?: string;
  className?: string;
  requiresRebuild?: boolean;
  showIndicator?: boolean;
}

/* Inline label + toggle switch for model-catalog preview settings. */
export function LabeledSwitch({
  label,
  checked,
  onChange,
  disabled = false,
  labelTextColor = 'text-gray-300',
  labelFontSize = 'text-sm',
  labelFontWeight = 'font-medium',
  labelClassName,
  className,
  requiresRebuild = false,
  showIndicator = false,
}: LabeledSwitchProps)
{
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    onChange(e.target.checked);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <label
          className={cn(
            labelFontSize,
            labelFontWeight,
            labelTextColor,
            labelClassName,
          )}
        >
          {label}
        </label>
        {showIndicator && (
          <span
            title={
              requiresRebuild
                ? 'Requires rebuild - click Rebuild Vehicle to apply'
                : 'Runtime - applies immediately'
            }
            className="inline-flex items-center"
          >
            {requiresRebuild ? (
              <Wrench className="h-3 w-3 text-gray-400" />
            ) : (
              <Zap className="h-3 w-3 text-gray-400" />
            )}
          </span>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-600 outline-none rounded-full peer peer-checked:bg-gray-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-500 after:border-2 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" />
      </label>
    </div>
  );
}
